using Domain.Contracts;
using Microsoft.EntityFrameworkCore;
using Persistence.Data.Contexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Repositories
{
    public class CompositeKeyGenericRepository<TEntity> :
        ICompositeKeyGenericRepository<TEntity> where TEntity : class
    {
        private readonly AppDbContext _context;

        public CompositeKeyGenericRepository(AppDbContext context)
        {
            _context = context;
        }


        public async Task<TEntity?> GetByCompositeKeyAsync(
            params object[] keyValues)
        {
            return await _context.Set<TEntity>().FindAsync(keyValues);
        }


        public async Task<IEnumerable<TEntity>> GetAllAsync()
        {
            return await _context.Set<TEntity>().ToListAsync();
        }

        public async Task AddAsync(TEntity entity)
        {
            await _context.Set<TEntity>().AddAsync(entity);
        }

        public void Update(TEntity entity)
        {
            _context.Set<TEntity>().Update(entity);
        }


        public void Delete(TEntity entity)
        {
            _context.Set<TEntity>().Remove(entity);
        }
    }
}
