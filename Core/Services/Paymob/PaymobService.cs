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
using Domain.Exceptions;
using Domain.Entities.Enums;
using System.Net;
using System.Net.Http.Json;

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
            {
                var issueCode = ClassifyConfigurationIssue(response.StatusCode, responseBody);

                throw new PaymobApiException(response.StatusCode,
                                             "Paymob rejected the payment request.",
                                             issueCode,
                                             responseBody);
            }


            var result = JsonSerializer.Deserialize<PaymobCreateIntentionResponse>(responseBody, new JsonSerializerOptions()
            {
                PropertyNameCaseInsensitive = true
            });

            if (result is null || string.IsNullOrWhiteSpace(result.Id) || string.IsNullOrWhiteSpace(result.ClientSecret))
                throw new InternalServerErrorException("Paymob returned an invalid payment intention response.");

            return result;
        }



        private static PaymentConfigurationIssueCode? ClassifyConfigurationIssue(HttpStatusCode statusCode,
                                                                                 string responseBody)
        {
            // Authentication / authorization failure.
            if (statusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                return PaymentConfigurationIssueCode.PaymobAuthenticationFailed;

            // Invalid integration configuration.
            if (statusCode == HttpStatusCode.BadRequest && ContainsAny(responseBody,
                                                                      "integration",
                                                                      "payment method",
                                                                      "payment_methods",
                                                                      "invalid integration"))
            {
                return PaymentConfigurationIssueCode.InvalidIntegration;
            }

            // Do not classify provider/server errors as clinic configuration issues.
            // They may be temporary Paymob-side failures.
            return null;
        }


        private static bool ContainsAny(string value, params string[] keywords)
        {
            if (string.IsNullOrWhiteSpace(value))
                return false;

            return keywords.Any(keyword => value.Contains(keyword, StringComparison.OrdinalIgnoreCase));
        }




        public async Task<RefundResult> RefundAsync(
    string secretKey,
    long transactionId,
    long amountCents)
        {
            if (string.IsNullOrWhiteSpace(secretKey))
                throw new BadRequestException(
                    "Paymob secret key is not configured.");

            if (transactionId <= 0)
                throw new BadRequestException(
                    "The Paymob transaction ID is invalid.");

            if (amountCents <= 0)
                throw new BadRequestException(
                    "The refund amount must be greater than zero.");


            var request = new PaymobRefundRequest
            {
                TransactionId = transactionId,
                AmountCents = amountCents
            };


            using var httpRequest = new HttpRequestMessage(
                HttpMethod.Post,
                $"{_paymobSettings.BaseUrl}/api/acceptance/void_refund/refund");

            httpRequest.Headers.Authorization =
                new AuthenticationHeaderValue("Token", secretKey);

            httpRequest.Content =
                JsonContent.Create(request);


            HttpResponseMessage response;

            try
            {
                response =
                    await _httpClient.SendAsync(httpRequest);
            }
            catch (HttpRequestException ex)
            {
                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "We could not confirm the refund result with Paymob.",
                    ProviderResponse = ex.Message
                };
            }
            catch (TaskCanceledException ex)
            {
                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "The refund request timed out before its result could be confirmed.",
                    ProviderResponse = ex.Message
                };
            }


            var responseBody =
                await response.Content.ReadAsStringAsync();


            // ---------------------------------------------------------
            // Paymob definitely rejected the request
            // ---------------------------------------------------------

            if (!response.IsSuccessStatusCode)
            {
                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = false,
                    ErrorMessage =
                        "Paymob could not process the refund.",
                    ProviderResponse =
                        responseBody
                };
            }


            // ---------------------------------------------------------
            // Parse provider response
            // ---------------------------------------------------------

            PaymobRefundResponse? refundResponse;

            try
            {
                refundResponse =
                    JsonSerializer.Deserialize<PaymobRefundResponse>(
                        responseBody,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
            }
            catch (JsonException)
            {
                /*
                 * HTTP 2xx does not prove that the refund was completed.
                 *
                 * The request reached Paymob, but Clinova could not
                 * safely determine the final refund state.
                 */

                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "Paymob accepted the refund request, but the response could not be verified.",
                    ProviderResponse =
                        responseBody
                };
            }


            if (refundResponse is null)
            {
                return new RefundResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "Paymob returned an empty refund response.",
                    ProviderResponse =
                        responseBody
                };
            }


            var refundedAmount =
                refundResponse.RefundedAmountCentsInt
                ?? refundResponse.RefundedAmountCents
                ?? 0;


            // ---------------------------------------------------------
            // Refund confirmed
            // ---------------------------------------------------------

            var refundConfirmed =
    refundResponse.Success &&
    !refundResponse.Pending &&
    refundResponse.IsRefund &&
    refundResponse.AmountCents == amountCents &&
    refundResponse.ParentTransaction == transactionId;

            if (refundConfirmed)
            {
                return new RefundResult
                {
                    Succeeded = true,
                    PendingVerification = false,
                    ProviderRefundTransactionId =
                        refundResponse.Id > 0
                            ? refundResponse.Id.ToString()
                            : null,
                    ProviderResponse =
                        responseBody
                };
            }


            // ---------------------------------------------------------
            // Provider accepted the request but final state is unclear
            // ---------------------------------------------------------

            return new RefundResult
            {
                Succeeded = false,
                PendingVerification = true,
                ProviderRefundTransactionId =
                    refundResponse.Id > 0
                        ? refundResponse.Id.ToString()
                        : null,
                ErrorMessage =
                    "Paymob accepted the refund request, but the final refund status could not be confirmed.",
                ProviderResponse =
                    responseBody
            };
        }




        // ============================================================
        // Transaction Inquiry
        // ============================================================

        public async Task<PaymobTransactionInquiryResult> GetTransactionAsync(
            string apiKey,
            long transactionId)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new BadRequestException(
                    "Paymob API key is not configured.");
            }

            if (transactionId <= 0)
            {
                throw new BadRequestException(
                    "The Paymob transaction ID is invalid.");
            }

            string authToken;

            try
            {
                authToken = await GenerateInquiryAuthTokenAsync(apiKey);
            }
            catch (HttpRequestException ex)
            {
                return new PaymobTransactionInquiryResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "We could not connect to Paymob to verify the transaction.",
                    ProviderResponse = ex.Message
                };
            }
            catch (TaskCanceledException ex)
            {
                return new PaymobTransactionInquiryResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "The Paymob transaction verification request timed out.",
                    ProviderResponse = ex.Message
                };
            }

            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"{_paymobSettings.BaseUrl}/api/acceptance/transactions/{transactionId}");

            request.Headers.Authorization =
                new AuthenticationHeaderValue(
                    "Bearer",
                    authToken);

            HttpResponseMessage response;

            try
            {
                response = await _httpClient.SendAsync(request);
            }
            catch (HttpRequestException ex)
            {
                return new PaymobTransactionInquiryResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "We could not connect to Paymob to verify the transaction.",
                    ProviderResponse = ex.Message
                };
            }
            catch (TaskCanceledException ex)
            {
                return new PaymobTransactionInquiryResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "The Paymob transaction verification request timed out.",
                    ProviderResponse = ex.Message
                };
            }

            var responseBody =
                await response.Content.ReadAsStringAsync();

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return new PaymobTransactionInquiryResult
                {
                    Succeeded = false,
                    PendingVerification = false,
                    NotFound = true,
                    ErrorMessage =
                        "Paymob could not find the requested transaction.",
                    ProviderResponse = responseBody
                };
            }

            if (!response.IsSuccessStatusCode)
            {
                return new PaymobTransactionInquiryResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "Paymob could not verify the transaction.",
                    ProviderResponse = responseBody
                };
            }

            PaymobTransactionInquiryResponse? transaction;

            try
            {
                transaction =
                    JsonSerializer.Deserialize<PaymobTransactionInquiryResponse>(
                        responseBody,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
            }
            catch (JsonException)
            {
                return new PaymobTransactionInquiryResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "Paymob returned an invalid transaction verification response.",
                    ProviderResponse = responseBody
                };
            }

            if (transaction is null)
            {
                return new PaymobTransactionInquiryResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "Paymob returned an empty transaction verification response.",
                    ProviderResponse = responseBody
                };
            }

            if (transaction.Id != transactionId)
            {
                return new PaymobTransactionInquiryResult
                {
                    Succeeded = false,
                    PendingVerification = true,
                    ErrorMessage =
                        "Paymob returned a transaction different from the requested transaction.",
                    ProviderResponse = responseBody
                };
            }

            return new PaymobTransactionInquiryResult
            {
                Succeeded = true,
                PendingVerification = false,
                NotFound = false,
                Transaction = transaction,
                ProviderResponse = responseBody
            };
        }


        // ============================================================
        // Paymob Inquiry Authentication
        // ============================================================

        private async Task<string> GenerateInquiryAuthTokenAsync(
            string apiKey)
        {
            var requestBody = new
            {
                api_key = apiKey
            };

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"{_paymobSettings.BaseUrl}/api/auth/tokens");

            request.Content =
                JsonContent.Create(requestBody);

            using var response =
                await _httpClient.SendAsync(request);

            var responseBody =
                await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"Paymob authentication failed with status code {(int)response.StatusCode}. " +
                    $"Response: {responseBody}");
            }

            PaymobAuthTokenResponse? result;

            try
            {
                result =
                    JsonSerializer.Deserialize<PaymobAuthTokenResponse>(
                        responseBody,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
            }
            catch (JsonException ex)
            {
                throw new HttpRequestException(
                    "Paymob returned an invalid authentication response.",
                    ex);
            }

            if (result is null)
            {
                throw new HttpRequestException(
                    "Paymob returned an empty authentication response.");
            }

            var token =
                result.Token;

            if (string.IsNullOrWhiteSpace(token))
            {
                throw new HttpRequestException(
                    "Paymob did not return a valid authentication token.");
            }

            return token;
        }



    }
}
