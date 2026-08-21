export function bindMobileFlightFilterAccordion({ toggle, body, chevron }) {
  const setExpanded = (expanded) => {
    body.classList.toggle('flight-filters-collapsed', !expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.classList.toggle('expanded', expanded);
    chevron.classList.toggle('open', expanded);
  };

  const handleClick = () => {
    setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
  };

  toggle.addEventListener('click', handleClick);

  return {
    setExpanded,
    disconnect() {
      toggle.removeEventListener('click', handleClick);
    }
  };
}
