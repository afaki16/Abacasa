using System;

namespace Abacasa.Application.Features.People.Dtos;

public class PersonDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Relation { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int? UpdatedBy { get; set; }
}
