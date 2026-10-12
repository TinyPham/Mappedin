import {escapeMarkerHtml} from './aviationMarkerPolicy.js';
export function markerPresentation({name,icon,policy,sourceFloorId,ownershipKey,memberCount=1,checkinIsland='',showLabel=true}){
 const label=escapeMarkerHtml(policy.label||name),safeIcon=escapeMarkerHtml(icon||'/icon-category/AirportService/information.png');
 return `<div class="airport-poi-marker ${policy.required?'airport-poi-required':''} ${policy.iconOnly?'airport-poi-icon-only':''}" data-airport-key="${escapeMarkerHtml(ownershipKey||'')}" data-source-floor="${escapeMarkerHtml(sourceFloorId||'')}" data-member-count="${memberCount}" data-checkin-island="${escapeMarkerHtml(checkinIsland)}" role="button" tabindex="0" aria-label="${label}"${showLabel&&!policy.iconOnly?` title="${label}"`:''}>
  <span class="airport-poi-circle"><img src="${safeIcon}" alt="${label}" loading="lazy" onerror="this.hidden=true;this.parentElement.dataset.fallback='•'" /></span>
  ${showLabel&&!policy.iconOnly?`<span class="airport-poi-label">${label}</span>`:''}</div>`;
}
