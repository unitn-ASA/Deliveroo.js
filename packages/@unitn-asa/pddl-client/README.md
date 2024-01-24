# Pddl-client for https://github.com/AI-Planning/planning-as-a-service

## Autonomous Software Agents

Marco Robol - marco.robol@unitn.it

University of Trento - 2022/2023


### Running the examples

`$ npm start ./examples/1solveAndExecute.js`


### Configurations

See `.env.example`

```
# The host of the planning-as-a-service server
# PAAS_HOST='https://solver.planning.domains:5001'  // default
# PAAS_HOST='https://paas-uom.org:5001'
# PAAS_HOST='http://localhost:5001'                 // when running locally

# The API path on the planning-as-a-service server
# PAAS_PATH='/package/dual-bfws-ffparser/solve'     // default
# PAAS_PATH='/package/delfi/solve'
# PAAS_PATH='/package/enhsp-2020/solve'
# PAAS_PATH='/package/forbiditerative-topk/solve'   // PARSING NOT SUPPORTED YET
# PAAS_PATH='/package/lama-first/solve'             // PARSING NOT SUPPORTED YET
# PAAS_PATH='/package/optic/solve'
# PAAS_PATH='/package/tfd/solve'                    // PARSING NOT SUPPORTED YET
``````