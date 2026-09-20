using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Paymob
{
    public class PaymobClient
    {
        private readonly HttpClient _httpClient;

        public PaymobClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public HttpClient HttpClient => _httpClient;
    }
}
