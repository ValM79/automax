// What the strip under a saved ad (or a notification) says about the ad. The state itself (live / sold / expired / removed)
// comes from the getAdStatuses function, because a saved copy of an ad is only a snapshot.
export const AD_STATE = {
  live: { label: 'Still for sale', live: true },
  sold: { label: 'Sold', live: false },
  expired: { label: 'Ended', live: false },
  removed: { label: 'Taken down by the seller', live: false },
};
