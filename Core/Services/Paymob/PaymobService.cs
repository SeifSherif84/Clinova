using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http.Headers;
using System.Text.Json;
using Domain.Exceptions.BadRequest;
using Domain.Exceptions.InternalServerError;
using Microsoft.Extensions.Options;
using Shared.Dtos.Paymob;
using Services.Abstractions.Paymob;

namespace Services.Paymob
{
    public class PaymobService(HttpClient _httpClient,
                               IOptions<PaymobSettings> _options) : IPaymobService
    {
        private readonly PaymobSettings _paymobSettings = _options.Value;

        public async Task<PaymobCreateIntentionResponse> CreatePaymentIntentionAsync(string secretKey, PaymobCreateIntentionRequest request)
        {
            if (string.IsNullOrWhiteSpace(secretKey))
                throw new BadRequestException("The Paymob secret key is not configured.");

            var json = JsonSerializer.Serialize(request);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_paymobSettings.BaseUrl}/v1/intention/");
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Token", secretKey);
            httpRequest.Content = new StringContent(json, Encoding.UTF8, "application/json");
            using var response = await _httpClient.SendAsync(httpRequest);

            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new BadRequestException($"Paymob rejected the payment request. StatusCode: {(int)response.StatusCode}");

            var result = JsonSerializer.Deserialize<PaymobCreateIntentionResponse>(responseBody, new JsonSerializerOptions()
            {
                PropertyNameCaseInsensitive = true
            });

            if (result is null || string.IsNullOrWhiteSpace(result.Id) || string.IsNullOrWhiteSpace(result.ClientSecret))
                throw new InternalServerErrorException("Paymob returned an invalid payment intention response.");

            return result;
        }
    }
}
