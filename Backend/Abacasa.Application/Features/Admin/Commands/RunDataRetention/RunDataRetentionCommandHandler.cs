using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using MediatR;

namespace Abacasa.Application.Features.Admin.Commands.RunDataRetention;

public class RunDataRetentionCommandHandler : IRequestHandler<RunDataRetentionCommand, Result<IReadOnlyDictionary<string, int>>>
{
    private readonly IDataRetentionRunner _runner;

    public RunDataRetentionCommandHandler(IDataRetentionRunner runner)
    {
        _runner = runner;
    }

    public async Task<Result<IReadOnlyDictionary<string, int>>> Handle(RunDataRetentionCommand request, CancellationToken cancellationToken)
    {
        return Result<IReadOnlyDictionary<string, int>>.Success(await _runner.RunAsync(cancellationToken));
    }
}
