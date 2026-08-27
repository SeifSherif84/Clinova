using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Contracts
{
    public interface IGenericRepository<TEntity, TKey> where TEntity : class
    {
        Task<TEntity?> GetByIdAsync(TKey id);
        Task<IEnumerable<TEntity>> GetAllAsync();
        Task AddAsync(TEntity entity);
        void Update(TEntity entity);
        void Delete(TEntity entity);


        Task<TEntity?> GetByIdAsync(IBaseSpecifications<TEntity, TKey> specifications);
        Task<IEnumerable<TEntity>> GetAllAsync(IBaseSpecifications<TEntity, TKey> specifications);
    }
}
