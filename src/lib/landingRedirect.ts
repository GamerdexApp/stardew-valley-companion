import { STORAGE_KEY } from "@/service/storage";

/**
 * A visitor with a saved playthrough goes to the dashboard before anything paints. The address
 * `/?home` opens the landing page without the jump, and the logo and every Home link use it. The
 * script runs in the page head, so it cannot use anything but the browser.
 */
export const redirectReturningVisitor = `try{if(location.search.indexOf("home")<0){var d=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}");if(d.playthroughs&&d.playthroughs.length>0)location.replace("/overview")}}catch(e){}`;
