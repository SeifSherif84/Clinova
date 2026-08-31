using Domain.Contracts;
using Persistence.Data.Contexts;
using Persistence.Repositories;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.UnitOfWork
{
    public class UnitOfWork(AppDbContext _context) : IUnitOfWork
    {
        private ConcurrentDictionary<string, object> _repositories = new ConcurrentDictionary<string, object>();

        public IGenericRepository<TEntity, TKey> GetRepository<TEntity, TKey>() where TEntity : class
        {
            return (IGenericRepository<TEntity, TKey>) _repositories.GetOrAdd(typeof(TEntity).Name, new GenericRepositiry<TEntity, TKey>(_context));
        }

        public ICompositeKeyGenericRepository<TEntity> GetRepository<TEntity>() where TEntity : class
        {
            return (ICompositeKeyGenericRepository<TEntity>)_repositories.GetOrAdd(typeof(TEntity).Name, new CompositeKeyGenericRepository<TEntity>(_context));
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

    }
}
