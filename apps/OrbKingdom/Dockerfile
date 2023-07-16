FROM heroiclabs/nakama-pluginbuilder:3.16.0 AS builder

WORKDIR /backend
COPY . .

FROM registry.heroiclabs.com/heroiclabs/nakama:3.16.0

COPY --from=builder /backend/modules/*.js /nakama/data/modules
COPY local.yml /nakama/data/
