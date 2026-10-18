using Abacasa.Application.Common.Results;
using MediatR;
using System;

namespace Abacasa.Application.Features.Roles.Commands.DeleteRole
{
    public class DeleteRoleCommand : IRequest<Result>
    {
        public int Id { get; set; }
    }
} 
