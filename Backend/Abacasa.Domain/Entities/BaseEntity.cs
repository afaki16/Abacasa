using System;

namespace Abacasa.Domain.Entities
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public bool IsDeleted { get; set; }
        // Soft delete zamanı (UTC); ApplicationDbContext.SaveChanges'te IsDeleted değişince atanır/temizlenir. İmha süresi buna göre.
        public DateTime? DeletedDate { get; set; }

        protected BaseEntity()
        {
            CreatedDate = DateTime.UtcNow;
            IsDeleted = false;
        }
    }
} 
