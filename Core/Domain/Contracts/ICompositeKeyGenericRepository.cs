using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Contracts
{
    public interface ICompositeKeyGenericRepository<TEntity> where TEntity : class
    {
        Task<TEntity?> GetByCompositeKeyAsync(params object[] keyValues);
        Task<IEnumerable<TEntity>> GetAllAsync();
        Task AddAsync(TEntity entity);
        void Update(TEntity entity);
        void Delete(TEntity entity);
    }

}
