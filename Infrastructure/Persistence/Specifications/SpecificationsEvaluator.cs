using Domain.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Specifications
{
    public static class SpecificationsEvaluator
    {
        public static IQueryable<TEntity> GenerateQuery<TEntity, TKey>(IQueryable<TEntity> BaseQuery, IBaseSpecifications<TEntity, TKey> specifications) where TEntity : class
        {
            IQueryable<TEntity> Query = BaseQuery; 

            if(specifications.Criteria != null)
                Query = Query.Where(specifications.Criteria); 

            if (specifications.OrderBy != null)
                Query = Query.OrderBy(specifications.OrderBy);

            if (specifications.OrderByDescending != null)
                Query = Query.OrderByDescending(specifications.OrderByDescending);

            if (specifications.IsPaginationEnabled)
                Query = Query.Skip(specifications.Skip).Take(specifications.Take);

            Query = specifications.Includes.Aggregate((Query), (currentQuery, includeExpression) => currentQuery.Include(includeExpression));

            return Query;
        }
    }
}
