using System;

namespace Abacasa.Application.Features.People.Dtos;

public class PersonListDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Relation { get; set; }
    public DateTime CreatedDate { get; set; }
}
