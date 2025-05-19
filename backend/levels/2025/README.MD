# ASA 2025 - unitn

Scenarios to validate your agent:

## Challenge 1

- Single agent should be tested on all 25_c1* scenarios.

## Challenge 2

- Coordinated agents should be tested on all 25_c2* scenarios;
- And an additional special scenario: "Hallway" 25_c2hallway

### Special "Hallway" cordination scenario 25_c2hallway.js

The scenario consists of a 1-tile narrow corridor where on onw side there is a delivering tile, while on the other side ther is the spawning tile with the parcels.
There are two agents on the corridor, so they have to coordinate to pickup and deliver the parcel, as each of them can only reach one side of the hallway. 

