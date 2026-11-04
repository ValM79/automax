// The five kinds of account (the value stored on the profile as seller_type):
//   private     someone who sells a few cars a year
//   trader      sells cars as a trade (VAT registered)
//   dealership  a brand representative: cars go in Dealership Cars
//   dealer      a set business that buys and sells: gets its own page and card in Dealers Garage
//   service     a Service Business (car rental, recovery, HGV or auto repair): paid listing in its category's directory
// Everything except private is a business account.
export const BUSINESS_TYPES = ['trader', 'dealership', 'dealer', 'service'];
export const isBusinessType = (type) => BUSINESS_TYPES.includes(type);
export const accountLabel = (type) => ({ trader: 'Trader', dealership: 'Dealership', dealer: 'Dealer', service: 'Service Business' }[type] || 'Private');

// What an ad says about its seller, from the flags stored on the ad when it was placed.
export const sellerTypeOf = (ad) => {
  if (!ad.isTrader) return 'Private Seller';
  if (ad.sellerKind === 'dealer') return 'Dealer';
  if (ad.sellerKind === 'dealership') return 'Dealership';
  return 'Trader';
};
