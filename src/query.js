import { GraphQLClient, gql } from "graphql-request";
import { reject } from "lodash-es";
import { get } from "svelte/store";

import {
  completeFilter,
  filteredGames,
  games,
  gamesPage,
  gamesTotalPages,
  ignoredFilter,
  incompleteFilter,
  nameFilter,
  oneRegionActualSize,
  oneRegionFilter,
  oneRegionOriginalSize,
  pageSize,
  roms,
  romsPage,
  romsTotalPages,
  systems,
  systemsPage,
  systemsTotalPages,
  totalActualSize,
  totalOriginalSize,
  unfilteredGames,
  unfilteredRoms,
  unfilteredSystems,
} from "./store.js";

const endpoint = "/graphql";
const graphQLClient = new GraphQLClient(endpoint);

function paginate(array, page, pageSize) {
  const start = pageSize * (page - 1);
  const end = Math.min(pageSize * page, array.length);
  return array.slice(start, end);
}

export async function getSystems() {
  const query = gql`
    {
      systems {
        id
        name
        description
        complete
        merging
        arcade
      }
    }
  `;

  const data = await graphQLClient.request(query);
  unfilteredSystems.set(data.systems);
  await updateSystems();
}

export async function updateSystems() {
  systemsTotalPages.set(Math.max(Math.ceil(get(unfilteredSystems).length / get(pageSize)), 1));
  systems.set(paginate(get(unfilteredSystems), get(systemsPage), get(pageSize)));
}

export async function getGamesBySystemId(systemId) {
  const query = gql`
        {
            games(systemId: ${systemId}) {
                id
                name
                description
                complete
                sorting
            }
        }
    `;

  const data = await graphQLClient.request(query);
  unfilteredGames.set(data.games);
  await updateGames();
}

function filterGames(games) {
  if (!get(completeFilter)) {
    games = reject(games, (game) => game.complete);
  }
  if (!get(incompleteFilter)) {
    games = reject(games, (game) => !game.complete);
  }
  if (!get(ignoredFilter)) {
    games = reject(games, (game) => game.sorting === 2);
  }
  if (get(oneRegionFilter)) {
    games = reject(games, (game) => game.sorting !== 1);
  }
  if (get(nameFilter).length) {
    games = reject(
      games,
      (game) => !game.name.normalize("NFC").toLowerCase().includes(get(nameFilter).normalize("NFC").toLocaleLowerCase())
    );
  }
  return games;
}

export async function updateGames() {
  filteredGames.set(filterGames(get(unfilteredGames)));
  gamesTotalPages.set(Math.max(Math.ceil(get(filteredGames).length / get(pageSize)), 1));
  games.set(paginate(get(filteredGames), get(gamesPage), get(pageSize)));
}

export async function getRomsByGameIdAndSystemId(gameId, systemId) {
  const query = gql`
        {
            roms(gameId: ${gameId}) {
                name
                size
                romfile {
                    path
                    size
                }
                ignored(systemId: ${systemId})
            }
        }
    `;

  const data = await graphQLClient.request(query);
  unfilteredRoms.set(data.roms);
  await updateRoms();
}

export async function updateRoms() {
  romsTotalPages.set(Math.max(Math.ceil(get(unfilteredRoms).length / get(pageSize)), 1));
  roms.set(paginate(get(unfilteredRoms), get(romsPage), get(pageSize)));
}

export async function getSizesBySystemId(systemId) {
  const query = gql`
        {
            totalOriginalSize(systemId: ${systemId})
            oneRegionOriginalSize(systemId: ${systemId})
            totalActualSize(systemId: ${systemId})
            oneRegionActualSize(systemId: ${systemId})
        }
    `;
  const data = await graphQLClient.request(query);
  totalOriginalSize.set(data.totalOriginalSize);
  oneRegionOriginalSize.set(data.oneRegionOriginalSize);
  totalActualSize.set(data.totalActualSize);
  oneRegionActualSize.set(data.oneRegionActualSize);
}
