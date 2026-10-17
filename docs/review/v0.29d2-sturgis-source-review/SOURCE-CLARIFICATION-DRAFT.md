# Draft source clarification — not sent

For the Michigan 2024 precinct data steward and City of Sturgis GIS.

We are reviewing the shared boundary effective for the November 5, 2024 election between:

- City of Sturgis Precinct 2, state ID `WP-149-76960-00002`.
- Sturgis Township Precinct 1, state ID `WP-149-76980-00001`.

The state's native EPSG:3078 precinct export contains a triangular overlap with these vertices, in metres:

| Vertex | X | Y |
|---|---:|---:|
| West endpoint | 547329.7710 | 136144.4415 |
| Intermediate vertex | 547444.4744 | 136146.9248 |
| East endpoint | 547461.7685 | 136147.2777 |

Its approximate longitude/latitude centre is -85.42878353, 41.77403063. The overlap area is 1.2338043354 m², with a longest edge of about 132.028 m and maximum altitude of about 0.01869 m.

The 2022 state geometry places the triangle on the city side and includes a shared intermediate vertex in this area. The city-published precinct and city-limit layers instead place it outside the city, with boundary offsets larger than the triangle's width. We cannot establish the legally effective 2024 line from these differing digital representations.

Please clarify:

1. What was the shared precinct/jurisdiction boundary at this exact segment for the November 5, 2024 election?
2. Should both state precincts share the intermediate vertex, share the straight endpoint-to-endpoint segment, or use a different documented line?
3. Can you provide the authoritative geometry or controlling boundary description, its effective date, coordinate reference system, applicable transformation, and any correction/update reference?

Supporting files in this review packet:

- `source-comparison.geojson`: the overlap and nearby source boundaries in EPSG:3078.
- `boundary-comparison.png`: the source discrepancy, with vertical scale exaggerated.
- `source-review.json`: measurements and hashes of reviewed source files.
- `SOURCE-REVIEW.md`: source findings and the separately labeled allocation sensitivity.

This request seeks source clarification only. The existing application foundation remains unchanged, and neither hypothetical overlap owner has been accepted.
