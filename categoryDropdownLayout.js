export function getCategoryAreaListHeight(itemCount, rowHeight = 50, maxVisibleItems = 4) {
  const count = Math.max(0, Number(itemCount) || 0);
  const visibleCount = Math.min(Math.max(1, count), maxVisibleItems);
  return visibleCount * rowHeight;
}

export function shouldScrollCategoryAreaList(itemCount, maxVisibleItems = 4) {
  return (Number(itemCount) || 0) > maxVisibleItems;
}

export function getCategoryAreaListStyle(itemCount, rowHeight = 50, maxVisibleItems = 4) {
  const maxHeight = maxVisibleItems * rowHeight;
  return {
    height: `${getCategoryAreaListHeight(itemCount, rowHeight, maxVisibleItems)}px`,
    minHeight: '0px',
    maxHeight: `${maxHeight}px`,
    flexShrink: '0',
    overflowY: shouldScrollCategoryAreaList(itemCount, maxVisibleItems) ? 'auto' : 'hidden'
  };
}

export function getCategoryAreaListStyleForRows(renderedItemCount, sourceItemCount, rowHeight = 50, maxVisibleItems = 4) {
  const renderedCount = Math.max(0, Number(renderedItemCount) || 0);
  const sourceCount = Math.max(0, Number(sourceItemCount) || 0);
  return getCategoryAreaListStyle(Math.max(renderedCount, sourceCount), rowHeight, maxVisibleItems);
}
