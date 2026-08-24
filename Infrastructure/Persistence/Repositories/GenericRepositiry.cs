using Domain.Contracts;
using Persistence.Data.Contexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Repositories
{
    public class GenericRepositiry<TEntity, TKey> : IGenericRepository<TEntity, TKey> where TEntity : class
    {
        private AppDbContext _context;

        public GenericRepositiry(AppDbContext context)
        {
            _context = context;
        }

        public Task<TEntity?> GetByIdAsync(TKey id)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<TEntity>> GetAllAsync()
        {
            throw new NotImplementedException();
        }
        public Task AddAsync(TEntity entity)
        {
            throw new NotImplementedException();
        }

        public void Update(TEntity entity)
        {
            throw new NotImplementedException();
        }
        public void Delete(TKey id)
        {
            throw new NotImplementedException();
        }
    }
}
