using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;

namespace Abacasa.Infrastructure.Repositories;

public class FundMovementRepository : RepositoryBase<FundMovement, int>, IFundMovementRepository
{
    public FundMovementRepository(ApplicationDbContext context) : base(context) { }
}
