using Abacasa.Application.Features.Auth.Dtos;
using Abacasa.Application.Features.Auth.Models;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Abacasa.Application.Interfaces
{
    public interface IAuthService
    {
        // tenantId yok sayılır: kimlik global, aktif hane üyeliklerden seçilir
        Task<Result<LoginResponseDto>> LoginAsync(string email, string password, string ipAddress, string userAgent, string deviceId = null, string deviceName = null, bool rememberMe = false, int? tenantId = null);
        // tenantId: oturumun aktif hanesi (tenant_id claim'i)
        Task<Result<string>> GenerateAccessTokenAsync(User user, int? tenantId);
        Task<Result<RefreshTokenIssueResult>> GenerateRefreshTokenAsync(User user, string ipAddress, string userAgent, string deviceId = null, string deviceName = null, bool rememberMe = false, DateTime? preserveExpiryDate = null, int? tenantId = null);
        Task<Result<LoginResponseDto>> RefreshTokenAsync(string accessToken, string refreshToken, string ipAddress, string userAgent);
        // Oturumun aktif hanesini değiştirir; mevcut refresh token yeni hane ile rotate edilir
        Task<Result<LoginResponseDto>> SwitchHouseholdAsync(int userId, int tenantId, string refreshToken, string ipAddress, string userAgent);
        Task<Result> RevokeTokenAsync(string refreshToken, string ipAddress = null, string userAgent = null, string reason = null);
        Task<Result> RevokeAllUserTokensAsync(int userId, string ipAddress = null, string userAgent = null, string reason = null);
        Task<Result> RevokeTokensByDeviceAsync(int userId, string deviceId, string ipAddress = null, string userAgent = null, string reason = null);
        ClaimsPrincipal GetClaimsFromExpiredToken(string token);
        Task<bool> ValidateTokenAsync(string token);
    }
}
