---
title: "Buildium's appliance API endpoints stop working October 19, 2026"
description: "Buildium is retiring its rentals and associations appliance endpoints. Starting October 19, 2026, they return 410 Gone. Here's the full old-to-new endpoint list."
slug: buildium-appliance-endpoints-410
author: Occupella Engineering
datePublished: 2026-10-13
dateModified: 2026-10-13
---

Buildium deprecated its appliance endpoints on July 21, 2026, in favor of its new Inventory & Assets API. Starting Monday, October 19, 2026, every deprecated appliance endpoint returns `410 Gone`.

## Who this affects

Anything that reads or writes appliance records through the Buildium Open API: maintenance apps, warranty and asset trackers, custom reports and in-house scripts.

If you only use Buildium through its web app, nothing changes for you directly. If a tool connected to your Buildium account shows appliance data, ask whoever built it whether they've moved to the new endpoints.

## Old endpoint → new endpoint

| Deprecated | Replacement |
|---|---|
| `GET /v1/rentals/appliances` | `GET /v1/inventoryassets` |
| `GET /v1/rentals/appliances/{applianceId}` | `GET /v1/inventoryasset/{inventoryAssetId}` |
| `POST /v1/rentals/appliances` | `POST /v1/inventoryasset` |
| `PUT /v1/rentals/appliances/{applianceId}` | `PUT /v1/inventoryasset/{inventoryAssetId}` |
| `DELETE /v1/rentals/appliances/{applianceId}` | `DELETE /v1/inventoryasset/{inventoryAssetId}` |
| `GET /v1/rentals/appliances/{applianceId}/servicehistory` | `GET /v1/assetservicehistory/{inventoryAssetId}` |
| `GET /v1/rentals/appliances/{applianceId}/servicehistory/{serviceHistoryId}` | `GET /v1/assetservicehistory/{inventoryAssetId}/{assetServiceHistoryId}` |
| `POST /v1/rentals/appliances/{applianceId}/servicehistory` | `POST /v1/assetservicehistory/{inventoryAssetId}` |

The association endpoints (`/v1/associations/appliances` and everything under it) map to the same replacements.

## How to check if you're affected

1. Search your code for `/rentals/appliances` and `/associations/appliances`.
2. Check your request logs for those paths over the last 30 days.
3. Move each call to its replacement above. The path parameter changes from `applianceId` to `inventoryAssetId`, so check the request and response fields in Buildium's docs before you switch.
4. Test in your Buildium API sandbox if you have one.
5. Treat a `410` as permanent. Log it and alert on it instead of retrying.

## Source

Buildium Open API changelog, July 21, 2026 entry: <https://developer.buildium.com/>

Last checked October 13, 2026.
