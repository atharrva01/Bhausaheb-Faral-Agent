// Pages where the floating chat launcher and the mobile shop bar appear.
// Kept off checkout, order confirmation, 404 and owner pages so they never cover content.
export const SHOP_PAGES = ["/", "/about"];
export const isShopPage = (pathname: string) => SHOP_PAGES.includes(pathname);
