'use client';

import { useRef, useCallback } from 'react';
import * as d3 from 'd3';

function getTreeStatistics(node) {
   if (!node) return { generations: 0, totalPeople: 0, livingPeople: 0, deceasedPeople: 0, averageAge: 0 };

   function getDepth(n) {
      const visible = (Array.isArray(n.children) && n.children.length > 0) ? n.children : [];
      const collapsed = (Array.isArray(n._children) && n._children.length > 0) ? n._children : [];
      const allKids = [...visible, ...collapsed];
      if (allKids.length === 0) return 1;
      return 1 + Math.max(...allKids.map(getDepth));
   }

   const people = [];
   function flatten(n) {
      if (n) {
         people.push(n);
         // Walk both visible (children) and collapsed (_children) so the total
         // count reflects every person in the tree, not just the expanded nodes.
         if (Array.isArray(n.children)) n.children.forEach(flatten);
         if (Array.isArray(n._children)) n._children.forEach(flatten);
      }
   }
   flatten(node);

   let totalAge = 0, ageCount = 0, livingCount = 0, deceasedCount = 0;
   people.forEach(p => {
      if (p.alive) livingCount++; else deceasedCount++;
      if (p.dob && p.dod) {
         const dobYear = parseInt((p.dob.match(/\d{4}/) || [])[0] || 0);
         const dodYear = parseInt((p.dod.match(/\d{4}/) || [])[0] || 0);
         if (dobYear > 0 && dodYear > 0 && dodYear >= dobYear) { totalAge += dodYear - dobYear; ageCount++; }
      }
   });

   return {
      generations: getDepth(node),
      totalPeople: people.length,
      livingPeople: livingCount,
      deceasedPeople: deceasedCount,
      averageAge: ageCount > 0 ? Math.round(totalAge / ageCount) : 0,
   };
}

export function useTreeRendering(config, handleNodeClick, setSection, onLinkedFamilyClick, editingTools) {
   const svgRef = useRef();
   const rootRef = useRef(null);
   const zoomRef = useRef(null);
   const zoomTransformRef = useRef(null);
   const peopleRef = useRef([]);
   const statsRef = useRef(null);
   const mutableTreeRef = useRef(null);
   const sourceTreeRef = useRef(null);
   const autoFocusedIdRef = useRef(null);
   const pendingAnchorRef = useRef(null);
   // Track node IDs explicitly expanded by the user so we can restore them after re-initialization.
   const expandedNodeIds = useRef(new Set());

   const hasMeaningfulProfileData = (personData) => {
      return Boolean(personData && personData.name && String(personData.name).trim());
   };

   const getNodeYearsText = (personData) => {
      const dob = (personData?.dob || '').trim();
      const dod = (personData?.dod || '').trim();

      if (personData?.alive) {
         return dob ? `b. ${dob}` : '';
      }

      if (!dob && !dod) return '';
      if (dob && dod) return `${dob} - ${dod}`;
      return dob || dod;
   };

   const getNodeBodyBaseY = (personData) => {
      const words = (personData?.name || '').split(/\s+/).filter(Boolean);
      const yearsBase = 58 + (words.length > 2 ? 2 : 1) * 16;
      return yearsBase;
   };

   const getNodeNoChildY = (personData) => {
      const yearsY = getNodeBodyBaseY(personData);
      return getNodeYearsText(personData) ? yearsY + 14 : yearsY;
   };

   const getNodeFooterBaseY = (personData) => {
      let y = getNodeBodyBaseY(personData);
      if (getNodeYearsText(personData)) y += 16;
      if (personData?.isLawald) y += 16;
      return y;
   };

   // Keep selected branches collapsed by default, while allowing explicit expand per node.
   // 1) Female branches stay collapsed (existing behavior)
   // 2) Out-of-family branches are no longer auto-collapsed, because this was
   //    hiding newly added linked children after refresh.
   const collapseDefaultBranches = (node, isRoot = false) => {
      if (!node || !Array.isArray(node.children) || node.children.length === 0) return;

      // Recurse first so descendants decide their own collapsed state.
      node.children.forEach((child) => collapseDefaultBranches(child, false));

      const shouldCollapseByGender = !isRoot && node.gender === 'female';

      if (shouldCollapseByGender && Array.isArray(node.children) && node.children.length > 0) {
         node._children = [...(Array.isArray(node._children) ? node._children : []), ...node.children];
         delete node.children;
      }
   };

   // Re-expand nodes the user previously expanded so state survives data refreshes.
   const reExpandUserExpanded = (node) => {
      if (!node) return;
      if (node.id && expandedNodeIds.current.has(node.id)) {
         if (Array.isArray(node._children) && node._children.length > 0) {
            node.children = node._children;
            delete node._children;
         }
      }
      const kids = Array.isArray(node.children) ? node.children
         : Array.isArray(node._children) ? node._children : [];
      kids.forEach(reExpandUserExpanded);
   };

   const drawTree = useCallback(() => {
      try {
         if (!config.jsonData || !svgRef.current) return;

         // Initialize a mutable collapsed copy whenever source tree changes.
         if (sourceTreeRef.current !== config.jsonData) {
            sourceTreeRef.current = config.jsonData;
            mutableTreeRef.current = JSON.parse(JSON.stringify(config.jsonData));
            collapseDefaultBranches(mutableTreeRef.current, true);
            // Restore any branches the user had manually expanded.
            reExpandUserExpanded(mutableTreeRef.current);
            autoFocusedIdRef.current = null;
         }

         const container = svgRef.current.closest('.tree-container') || svgRef.current.parentElement;
         const containerRect = container ? container.getBoundingClientRect() : null;
         const width = (containerRect?.width > 0 ? containerRect.width : null) ||
            (container?.clientWidth > 0 ? container.clientWidth : null) ||
            window.innerWidth - 260;
         const height = (containerRect?.height > 0 ? containerRect.height : null) ||
            (container?.clientHeight > 0 ? container.clientHeight : null) ||
            window.innerHeight - 140;

         const svg = d3.select(svgRef.current);
         svg.attr('width', width).attr('height', height);
         svg.selectAll('*').remove();

         const root = d3.hierarchy(mutableTreeRef.current);
         // Keep branch orientation stable across redraws.
         // Prefer deeper subtrees on the left, then fall back to name for deterministic ordering.
         root.sort((a, b) => {
            const depthDelta = (b.height || 0) - (a.height || 0);
            if (depthDelta !== 0) return depthDelta;
            const aName = String(a.data?.name || '').toLowerCase();
            const bName = String(b.data?.name || '').toLowerCase();
            return aName.localeCompare(bName);
         });
         const treeLayout = d3.tree().nodeSize([240, 180]);
         treeLayout(root);

         rootRef.current = root;
         statsRef.current = getTreeStatistics(mutableTreeRef.current);

         // Build people list for search
         const peopleList = [];
         root.descendants().forEach((d) => {
            if (d.data && d.data.name) {
               peopleList.push({
                  id: d.data.id,
                  name: d.data.name || '',
                  fname: d.data.fname || '',
                  parentName: d.parent && d.parent.data ? d.parent.data.name || '' : '',
                  gender: d.data.gender || null,
                  focusId: d.data.id,
                  type: 'person',
               });
            }
            if (d.data && d.data.spouse) {
               const spouses = Array.isArray(d.data.spouse) ? d.data.spouse : [d.data.spouse];
               spouses.forEach((s) => {
                  peopleList.push({
                     id: s.id || `${d.data.id}-spouse`,
                     name: s.name || '',
                     fname: s.fname || '',
                     parentName: d.data.name || '',
                     gender: s.gender || null,
                     focusId: d.data.id,
                     type: 'spouse',
                  });
               });
            }
         });
         peopleRef.current = peopleList;

         // Calculate bounds — exclude the virtual root node itself (it sits one row
         // above all lineage heads and is invisible), so the viewport centres on real content.
         const realNodes = root.descendants().filter(d => !d.data.isVirtualRoot);
         const bounds = {
            minX: d3.min(realNodes, (d) => d.x),
            maxX: d3.max(realNodes, (d) => d.x),
            // minY from real nodes, not 0, so the virtual-root row doesn't add dead space at top.
            minY: d3.min(realNodes, (d) => d.y) ?? 0,
            maxY: d3.max(realNodes, (d) => d.y),
         };

         const offsetX = width / 2 - (bounds.maxX + bounds.minX) / 2;
         const offsetY = Math.max(60, (height - (bounds.maxY - bounds.minY)) / 2) - bounds.minY;

         const g = svg.append('g').attr('transform', `translate(${offsetX},${offsetY})`);

         // Zoom behavior
         const zoom = d3.zoom().on('zoom', (event) => {
            g.attr('transform', event.transform);
            zoomTransformRef.current = event.transform;
         });
         zoomRef.current = zoom;
         svg.call(zoom);

         // Keep current viewport stable across redraws (e.g. expand/collapse),
         // so the tree does not jump to another area.
         if (zoomTransformRef.current) {
            svg.call(zoom.transform, zoomTransformRef.current);
         }

         // If redraw was triggered by expand/collapse, keep the clicked node
         // at the same on-screen position so expansion feels in-place.
         if (pendingAnchorRef.current) {
            const anchor = pendingAnchorRef.current;
            const anchoredNode = root.descendants().find((d) => {
               if (!d.data) return false;
               if (anchor.dataRef && d.data === anchor.dataRef) return true;
               return anchor.nodeId != null && d.data.id === anchor.nodeId;
            });
            if (anchoredNode) {
               const currentScale = zoomTransformRef.current?.k || 1;
               const anchoredTransform = d3.zoomIdentity
                  .translate(anchor.screenX - anchoredNode.x * currentScale, anchor.screenY - anchoredNode.y * currentScale)
                  .scale(currentScale);
               svg.call(zoom.transform, anchoredTransform);
            }
            pendingAnchorRef.current = null;
         }

         // Default focus
         const defaultId = config.defaultFocusId;
         const targetNode = root.descendants().find((d) => d.data && d.data.id === defaultId);
         if (autoFocusedIdRef.current !== defaultId && !zoomTransformRef.current) {
            // Fit-to-screen on initial load: scale down wide/tall trees so the whole
            // tree is visible, but never zoom in beyond 1x.
            const treeWidth = bounds.maxX - bounds.minX || 1;
            const treeHeight = bounds.maxY - bounds.minY || 1;
            const padding = 80; // px padding on each side
            const scaleX = (width - padding * 2) / treeWidth;
            const scaleY = (height - padding * 2) / treeHeight;
            const s = Math.min(scaleX, scaleY, 1); // never zoom in, only out
            // Center the full tree in the viewport
            const cx = (bounds.minX + bounds.maxX) / 2;
            const cy = (bounds.minY + bounds.maxY) / 2;
            const tx = width / 2 - cx * s;
            const ty = height / 2 - cy * s;
            svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(s));
            autoFocusedIdRef.current = defaultId;
         }

         // Draw links — skip links TO the virtual root (it's invisible, no line needed)
         g.selectAll('.link')
            .data(root.links().filter(l => !l.target.data.isVirtualRoot && !l.source.data.isVirtualRoot))
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical().x((d) => d.x).y((d) => d.y));

         // Draw nodes
         const nodes = g.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', (d) => `node ${hasMeaningfulProfileData(d.data) ? 'has-popup' : 'no-popup'} ${editingTools?.enabled ? 'edit-mode' : ''}`)
            .attr('transform', (d) => `translate(${d.x},${d.y})`)
            .style('cursor', (d) => hasMeaningfulProfileData(d.data) ? 'pointer' : 'default');

         // Virtual root: truly invisible — no circle, no text, no badge.
         // Its only purpose is to give D3 a single hierarchy root when the family
         // has multiple disconnected lineage founders.
         nodes.filter(d => d.data.isVirtualRoot === true)
            .style('pointer-events', 'none');
         // intentionally renders nothing

         // For all REAL person nodes, draw the usual circle + icon + badges.
         const personNodes = nodes.filter(d => !d.data.isVirtualRoot);

         // Node circle
         personNodes.append('circle')
            .attr('r', 42)
            .attr('class', (d) => `node-bg ${d.data.gender || 'unknown'}`);

         // Person icon
         personNodes.append('foreignObject')
            .attr('x', -20).attr('y', -20).attr('width', 40).attr('height', 40)
            .append('xhtml:div')
            .style('display', 'flex').style('align-items', 'center').style('justify-content', 'center')
            .style('width', '100%').style('height', '100%')
            .html('<i class="fas fa-user" style="color: white; font-size: 40px;"></i>');

         // Alive indicator badge
         personNodes.append('circle')
            .attr('class', (d) => `alive-badge ${d.data.alive ? 'alive' : 'deceased'}`)
            .attr('r', 8).attr('cx', 32).attr('cy', 32);

         // Generation badge
         personNodes.append('circle')
            .attr('class', 'generation-badge')
            .attr('r', 12).attr('cx', 30).attr('cy', -30)
            .style('fill', '#FF6B35').style('stroke', '#fff').style('stroke-width', '2px');

         personNodes.append('text')
            .attr('class', 'generation-label')
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('x', 30).attr('y', -30)
            .text((d) => d.depth + 1)
            .style('font-size', '11px').style('font-weight', '700').style('fill', '#fff').style('pointer-events', 'none');

         // Cross-family navigation link: show on hover in view mode (not edit mode), on node right side.
         if (!editingTools?.enabled) {
            personNodes.filter((d) => d.data.link === true)
               .append('text')
               .attr('class', 'tree-linked-family-action')
               .attr('x', 0)
               .attr('y', (d) => {
                  return getNodeFooterBaseY(d.data) + 4;
               })
               .attr('text-anchor', 'middle')
               .style('font-size', '11px')
               .style('fill', '#93c5fd')
               .style('opacity', 0.78)
               .style('cursor', 'pointer')
               .style('font-weight', '500')
               .text('🔁 Linked Family')
               .on('mouseover', function () {
                  d3.select(this)
                     .style('fill', '#1d4ed8')
                     .style('opacity', 1)
                     .style('font-weight', '700');
               })
               .on('mouseout', function () {
                  d3.select(this)
                     .style('fill', '#93c5fd')
                     .style('opacity', 0.78)
                     .style('font-weight', '500');
               })
               .on('click', function (event, d) {
                  event.stopPropagation();
                  d3.select(this)
                     .style('fill', '#1d4ed8')
                     .style('opacity', 1)
                     .style('font-weight', '700');
                  const linkedFamilies = Array.isArray(d.data.linkedFamilies) ? d.data.linkedFamilies : [];
                  if (linkedFamilies.length > 1 && onLinkedFamilyClick) {
                     onLinkedFamilyClick(d.data, linkedFamilies);
                     return;
                  }
                  if (linkedFamilies.length === 1 && setSection) {
                     setSection(linkedFamilies[0].familyQasba, d.data.id);
                     return;
                  }
                  if (d.data.link && d.data.qasba && setSection) {
                     setSection(d.data.qasba, d.data.id);
                  }
               });
         }

         // Helper: find a spouse node ID that is a main tree node (isInCurrentFamily).
         // Used to show "→ See children" on female nodes whose husband is also a family member.
         const getSameFamilySpouseNodeId = (nodeData) => {
            if (nodeData.gender !== 'female') return null;
            const spouses = Array.isArray(nodeData.spouse)
               ? nodeData.spouse
               : nodeData.spouse ? [nodeData.spouse] : [];
            const sameFamilySpouse = spouses.find(sp => sp.isInCurrentFamily && sp.id);
            return sameFamilySpouse ? sameFamilySpouse.id : null;
         };

         // Expand/Collapse children control for each node with descendants.
         // For female nodes whose husband is also in this family, the children live under
         // the husband's node — show "→ See children" that pans to him instead.
         const nodesWithOwnChildren = personNodes.filter(
            (d) => (Array.isArray(d.data._children) && d.data._children.length > 0) ||
               (Array.isArray(d.data.children) && d.data.children.length > 0)
         );

         // "→ See children" — on female nodes with a same-family husband, even when
         // they have no children of their own (children are under the husband).
         personNodes.filter((d) => {
            if (d.data.gender !== 'female') return false;
            return !!getSameFamilySpouseNodeId(d.data);
         })
            .append('text')
            .attr('class', 'toggle-children-link')
            .attr('text-anchor', 'middle')
            .attr('y', (d) => {
               const footerBase = getNodeFooterBaseY(d.data);
               const hasOwnKids = (Array.isArray(d.data._children) && d.data._children.length > 0) ||
                  (Array.isArray(d.data.children) && d.data.children.length > 0);
               const linkedOffset = d.data.link && !editingTools?.enabled ? 22 : 0;
               // If she also has her own children (different husband), offset further down.
               return footerBase + 4 + linkedOffset + (hasOwnKids ? 18 : 0);
            })
            .style('font-size', '11px')
            .style('fill', '#2563eb')
            .style('cursor', 'pointer')
            .style('font-weight', '600')
            .text('→ See children')
            .on('click', function (event, d) {
               event.stopPropagation();
               const spouseNodeId = getSameFamilySpouseNodeId(d.data);
               if (!spouseNodeId || !rootRef.current || !svgRef.current || !zoomRef.current) return;
               const targetNode = rootRef.current.descendants().find(
                  (n) => n.data && n.data.id === spouseNodeId
               );
               if (!targetNode) return;
               const container = svgRef.current.closest('.tree-container') || svgRef.current.parentElement;
               const cw = container?.clientWidth || window.innerWidth - 260;
               const ch = container?.clientHeight || window.innerHeight - 140;
               const tx = cw / 2 - targetNode.x;
               const ty = ch / 2 - targetNode.y;
               const transform = d3.zoomIdentity.translate(tx, ty).scale(1);
               d3.select(svgRef.current)
                  .transition().duration(600)
                  .call(zoomRef.current.transform, transform);
               zoomTransformRef.current = transform;
            });

         nodesWithOwnChildren
            .append('text')
            .attr('class', 'toggle-children-link')
            .attr('text-anchor', 'middle')
            .attr('y', (d) => {
               const footerBase = getNodeFooterBaseY(d.data);
               if (d.data.link && !editingTools?.enabled) {
                  return footerBase + 22;
               }
               return footerBase + 4;
            })
            .style('font-size', '11px')
            .style('fill', '#16a34a')
            .style('cursor', 'pointer')
            .style('font-weight', '600')
            .text((d) => (Array.isArray(d.data._children) && d.data._children.length > 0 ? '＋ Expand children' : '－ Collapse children'))
            .on('click', function (event, d) {
               event.stopPropagation();
               if (svgRef.current) {
                  const rect = svgRef.current.getBoundingClientRect();
                  const nodeRect = this.parentNode?.getBoundingClientRect?.();
                  const screenX = nodeRect ? (nodeRect.left + nodeRect.width / 2 - rect.left) : (event.clientX - rect.left);
                  const screenY = nodeRect ? (nodeRect.top + nodeRect.height / 2 - rect.top) : (event.clientY - rect.top);
                  pendingAnchorRef.current = {
                     nodeId: d.data.id,
                     dataRef: d.data,
                     screenX,
                     screenY,
                  };
               }
               if (Array.isArray(d.data.children) && d.data.children.length > 0) {
                  // User is collapsing — remove from expanded set
                  expandedNodeIds.current.delete(d.data.id);
                  d.data._children = d.data.children;
                  delete d.data.children;
               } else if (Array.isArray(d.data._children) && d.data._children.length > 0) {
                  // User is expanding — add to expanded set
                  expandedNodeIds.current.add(d.data.id);
                  d.data.children = d.data._children;
                  delete d.data._children;
               }
               drawTree();
            });

         if (editingTools?.enabled) {
            const actionButtons = [
               {
                  key: 'add-child',
                  label: '+',
                  title: 'Add child',
                  fill: '#16a34a',
                  x: 54,
                  y: -46,
                  onClick: editingTools.onAddChild,
               },
               {
                  key: 'edit',
                  label: 'E',
                  title: 'Edit person',
                  fill: '#2563eb',
                  x: 54,
                  y: -18,
                  onClick: editingTools.onEdit,
               },
               {
                  key: 'delete',
                  label: 'X',
                  title: 'Delete person',
                  fill: '#dc2626',
                  x: 54,
                  y: 10,
                  onClick: editingTools.onDelete,
               }
            ];

            const actionGroups = personNodes
               .filter((d) => d.data?.dbId)
               .append('g')
               .attr('class', 'tree-node-actions');

            actionButtons.forEach((action) => {
               const group = actionGroups
                  .append('g')
                  .attr('class', `tree-node-action tree-node-action--${action.key}`)
                  .attr('transform', `translate(${action.x},${action.y})`)
                  .style('cursor', 'pointer')
                  .on('click', function (event, d) {
                     event.stopPropagation();
                     event.preventDefault();
                     action.onClick?.(d.data);
                  });

               group.append('circle')
                  .attr('r', 10)
                  .style('fill', action.fill)
                  .style('stroke', '#ffffff')
                  .style('stroke-width', '2px');

               group.append('text')
                  .attr('text-anchor', 'middle')
                  .attr('dominant-baseline', 'middle')
                  .style('fill', '#ffffff')
                  .style('font-size', '10px')
                  .style('font-weight', '700')
                  .style('pointer-events', 'none')
                  .text(action.label);

               group.append('title').text(action.title);
            });
         }

         // Node name (split into max 2 lines)
         personNodes.append('text')
            .attr('class', 'node-label')
            .attr('text-anchor', 'middle').attr('y', 58)
            .style('font-size', '13px').style('font-weight', '600')
            .style('fill', (d) => d.data.isLawald ? '#dc2626' : '#1f2937')
            .each(function (d) {
               const text = d.data.name || '';
               const words = text.split(/\s+/).filter(Boolean);
               let lines;
               if (words.length <= 2) {
                  lines = [words.join(' ')];
               } else {
                  const mid = Math.ceil(words.length / 2);
                  lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(l => l);
               }
               const t = d3.select(this);
               t.selectAll('tspan').data(lines).enter().append('tspan')
                  .attr('x', 0).attr('dy', (l, i) => (i === 0 ? '0em' : '1.2em')).text((l) => l);
            });

         personNodes.filter((d) => d.data.isLawald)
            .append('text')
            .attr('class', 'node-no-children-mark')
            .attr('text-anchor', 'middle')
            .attr('y', (d) => getNodeNoChildY(d.data))
            .style('font-size', '12px')
            .style('font-weight', '700')
            .style('fill', '#dc2626')
            .text('✝ No Child');

         // Node years
         personNodes.append('text')
            .attr('class', 'node-years')
            .attr('text-anchor', 'middle')
            .attr('y', (d) => getNodeBodyBaseY(d.data))
            .text((d) => getNodeYearsText(d.data))
            .style('font-size', '11px');

         // Click handler
         personNodes.on('click', (event, d) => {
            if (!hasMeaningfulProfileData(d.data)) return;
            event.stopPropagation();
            event.preventDefault();
            const rect = svgRef.current.getBoundingClientRect();
            const popupX = event.clientX - rect.left + 20;
            const popupY = event.clientY - rect.top + 20;
            handleNodeClick(d, popupX, popupY);
         });

         // Reset zoom on double-click
         svg.on('dblclick', () => {
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
         });
      } catch (error) {
         console.error('Error drawing tree:', error);
      }
   }, [config, handleNodeClick, setSection, onLinkedFamilyClick, editingTools]);

   const focusNodeById = useCallback((personId) => {
      if (!rootRef.current || !svgRef.current || !zoomRef.current) return;
      const targetNode = rootRef.current.descendants().find((d) => d.data && d.data.id === personId);
      if (!targetNode) return;

      const width = window.innerWidth - 280;
      const height = window.innerHeight - 140;
      const tx = width / 2 - targetNode.x;
      const ty = height / 2 - targetNode.y;

      d3.select(svgRef.current)
         .transition().duration(750)
         .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(1));

      zoomTransformRef.current = d3.zoomIdentity.translate(tx, ty).scale(1);
   }, []);

   const getStats = useCallback(() => statsRef.current, []);

   return { svgRef, drawTree, focusNodeById, rootRef, peopleRef, getStats };
}
