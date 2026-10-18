using Abacasa.Application.Common.Results;

namespace Abacasa.Application.Interfaces
{
    public interface IPasswordService
    {
        Result<string> HashPassword(string password);
        Result<bool> VerifyPassword(string password, string hashedPassword);
        Result<string> GenerateRandomPassword(int length = 12);
        Result<bool> ValidatePasswordStrength(string password);
    }
} 
