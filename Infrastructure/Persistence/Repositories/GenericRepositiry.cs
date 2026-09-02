using Domain.Contracts;
using Microsoft.EntityFrameworkCore;
using Persistence.Data.Contexts;
using Persistence.Specifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Repositories
{
    public class GenericRepositiry<TEntity, TKey> :
        IGenericRepository<TEntity, TKey> where TEntity : class
    {
        private readonly AppDbContext _context;

        public GenericRepositiry(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TEntity?> GetByIdAsync(TKey id)
        {
            return await _context.Set<TEntity>().FindAsync(id);
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


        
        public async Task<TEntity?> GetByIdAsync(IBaseSpecifications<TEntity, TKey> specifications)
        {
            return await ApplySpecifications(specifications).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<TEntity>> GetAllAsync(IBaseSpecifications<TEntity, TKey> specifications)
        {
            return await ApplySpecifications(specifications).ToListAsync();
        }


        private IQueryable<TEntity> ApplySpecifications(IBaseSpecifications<TEntity, TKey> specifications)
        {
            return SpecificationsEvaluator.GenerateQuery(_context.Set<TEntity>(), specifications);
        }

    }
}
