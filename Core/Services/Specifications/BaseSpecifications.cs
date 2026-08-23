using Domain.Contracts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Services.Specifications
{
    public class BaseSpecifications<TEntity, TKey> : IBaseSpecifications<TEntity, TKey> where TEntity : class
    {
        public List<Expression<Func<TEntity, object>>> Includes { get; set; }
        public Expression<Func<TEntity, bool>>? Criteria { get; set; }
        public Expression<Func<TEntity, object>>? OrderBy { get; set; }
        public Expression<Func<TEntity, object>>? OrderByDescending { get; set; }
        public bool IsPaginationEnabled { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }

        public BaseSpecifications()
        {
            Includes = new List<Expression<Func<TEntity, object>>>();
            Criteria = null;
            OrderBy = null;
            OrderByDescending = null;
            IsPaginationEnabled = false;
            Skip = 0;
            Take = 0;
        }
    }
}
