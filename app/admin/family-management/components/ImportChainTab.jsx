'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { importFamilyChain, previewFamilyChainImport } from '../utils/api';


/** Collect all dbId values in the tree (excluding virtual root). */
function collectDbIds(node, ids = new Set()) {
   if (!node || node.isVirtualRoot) return ids;
   if (node.dbId != null) ids.add(String(node.dbId));
   (node.children || []).forEach(child => collectDbIds(child, ids));
   return ids;
}

/**
 * Render the source family tree into the given SVG element.
 * Matches the visual style of the live Shajra-e-Saadaat tree.
 * Preserves zoom/pan state between re-renders via zoomTransformRef.
 */
function drawImportTree(treeData, selectedDbIds, onToggleBranch, svgElement, zoomTransformRef) {
   const svg = d3.select(svgElement);
   svg.selectAll('*').remove();

   const root = d3.hierarchy(treeData);
   root.sort((a, b) => {
      const delta = (b.height || 0) - (a.height || 0);
      if (delta !== 0) return delta;
      return String(a.data?.name || '').localeCompare(String(b.data?.name || ''));
   });

   const treeLayout = d3.tree().nodeSize([240, 180]);
   treeLayout(root);

   const realNodes = root.descendants().filter(d => !d.data.isVirtualRoot);
   const minX = d3.min(realNodes, d => d.x) ?? 0;
   const maxX = d3.max(realNodes, d => d.x) ?? 0;

   const containerWidth = svgElement.parentElement?.clientWidth || 900;
   const containerHeight = svgElement.parentElement?.clientHeight || 560;
   svg.attr('width', containerWidth).attr('height', containerHeight);

   const g = svg.append('g');

   const minY = d3.min(realNodes, d => d.y) ?? 0;
   const defaultOffsetX = containerWidth / 2 - (maxX + minX) / 2;
   const defaultOffsetY = 80 - minY;

   const zoom = d3.zoom()
      .scaleExtent([0.15, 2.5])
      .on('zoom', event => {
         g.attr('transform', event.transform);
         zoomTransformRef.current = event.transform;
      });

   svg.call(zoom);

   if (zoomTransformRef.current) {
      svg.call(zoom.transform, zoomTransformRef.current);
   } else {
      const initial = d3.zoomIdentity.translate(defaultOffsetX, defaultOffsetY);
      svg.call(zoom.transform, initial);
      zoomTransformRef.current = initial;
   }

   g.append('g')
      .selectAll('path')
      .data(root.links().filter(l => !l.target.data.isVirtualRoot && !l.source.data.isVirtualRoot))
      .join('path')
      .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y))
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2);

   const nodeGroups = g.selectAll('.imp-node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'imp-node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

   // Virtual root: invisible anchor only.
   nodeGroups.filter(d => d.data.isVirtualRoot === true)
      .style('pointer-events', 'none');

   const personNodes = nodeGroups.filter(d => !d.data.isVirtualRoot);

   personNodes.each(function (d) {
      const el = d3.select(this);
      const dbId = d.data.dbId != null ? String(d.data.dbId) : null;
      const isSel = !dbId || selectedDbIds.has(dbId);
      const gender = d.data.gender;
      const fill = gender === 'female' ? '#be185d' : gender === 'male' ? '#1e3a8a' : '#374151';
      const opacity = isSel ? 1 : 0.22;

      el.style('cursor', 'pointer');

      // Outer selection ring
      if (isSel) {
         el.append('circle').attr('r', 48)
            .attr('fill', 'none')
            .attr('stroke', '#93c5fd').attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,3')
            .style('pointer-events', 'none');
      }

      // Main circle
      el.append('circle').attr('r', 42)
         .attr('fill', fill)
         .attr('stroke', '#fff').attr('stroke-width', 2.5)
         .style('opacity', opacity)
         .style('filter', isSel ? 'drop-shadow(0 4px 12px rgba(15,23,42,0.2))' : 'none');

      // Initials
      const initials = (d.data.name || 'U')
         .split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
      el.append('text')
         .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('y', 3)
         .attr('fill', '#fff').attr('font-size', 18).attr('font-weight', 700)
         .style('pointer-events', 'none').style('opacity', opacity)
         .text(initials);

      // Alive badge
      el.append('circle').attr('r', 8).attr('cx', 32).attr('cy', 32)
         .attr('fill', d.data.alive ? '#16a34a' : '#9ca3af')
         .attr('stroke', '#fff').attr('stroke-width', 2)
         .style('opacity', opacity);

      // Generation badge
      el.append('circle').attr('r', 12).attr('cx', 30).attr('cy', -30)
         .attr('fill', '#FF6B35').attr('stroke', '#fff').attr('stroke-width', 2)
         .style('opacity', opacity);
      el.append('text')
         .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('x', 30).attr('y', -30)
         .attr('fill', '#fff').attr('font-size', 11).attr('font-weight', 700)
         .style('pointer-events', 'none').style('opacity', opacity)
         .text(d.depth + 1);

      // Name (up to 2 lines)
      const words = (d.data.name || 'Unknown').split(/\s+/).filter(Boolean);
      const line1 = words.slice(0, 2).join(' ');
      const line2 = words.slice(2).join(' ');
      el.append('text')
         .attr('text-anchor', 'middle').attr('y', 60)
         .attr('fill', isSel ? '#1f2937' : '#94a3b8')
         .attr('font-size', 12).attr('font-weight', 600)
         .style('pointer-events', 'none')
         .text(line1.length > 18 ? line1.slice(0, 18) + '\u2026' : line1);
      if (line2) {
         el.append('text')
            .attr('text-anchor', 'middle').attr('y', 76)
            .attr('fill', isSel ? '#374151' : '#94a3b8').attr('font-size', 11)
            .style('pointer-events', 'none')
            .text(line2.length > 18 ? line2.slice(0, 18) + '\u2026' : line2);
      }

      // Spouse name(s)
      if (d.data.spouse) {
         const list = Array.isArray(d.data.spouse) ? d.data.spouse : [d.data.spouse];
         const names = list.map(s => (s.name || '').split(/\s+/)[0]).join(', ');
         const spouseY = line2 ? 92 : 76;
         el.append('text')
            .attr('text-anchor', 'middle').attr('y', spouseY)
            .attr('fill', '#64748b').attr('font-size', 10)
            .style('pointer-events', 'none').style('opacity', opacity)
            .text('\u2665 ' + (names.length > 22 ? names.slice(0, 22) + '\u2026' : names));
      }

      // Toggle button (+/-)
      const btn = el.append('g').attr('transform', 'translate(54, 0)');
      btn.append('circle').attr('r', 12)
         .attr('fill', isSel ? '#2563eb' : '#e2e8f0')
         .attr('stroke', isSel ? '#1d4ed8' : '#94a3b8').attr('stroke-width', 1.5);
      btn.append('text')
         .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
         .attr('fill', isSel ? '#fff' : '#64748b').attr('font-size', 15).attr('font-weight', 700)
         .style('pointer-events', 'none')
         .text(isSel ? '\u2212' : '+');

      // Click: toggle this branch
      el.on('click', event => {
         event.stopPropagation();
         onToggleBranch(d.data);
      });
   });
}


export default function ImportChainTab({ selectedFamily, families, onImported }) {
   const [sourceFamilyId, setSourceFamilyId] = useState('');
   const [previewData, setPreviewData] = useState(null);
   const [selectedDbIds, setSelectedDbIds] = useState(new Set());
   const [loadingPreview, setLoadingPreview] = useState(false);
   const [loadingImport, setLoadingImport] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const svgRef = useRef(null);
   const zoomTransformRef = useRef(null);

   const sourceFamilies = useMemo(
      () => families.filter(f => f.id !== selectedFamily?.id),
      [families, selectedFamily]
   );

   const handleToggleBranch = useCallback(nodeData => {
      const branchIds = collectDbIds(nodeData);
      setSelectedDbIds(prev => {
         const next = new Set(prev);
         const allSel = [...branchIds].every(id => next.has(id));
         branchIds.forEach(id => allSel ? next.delete(id) : next.add(id));
         return next;
      });
   }, []);

   useEffect(() => {
      if (!previewData?.previewTree || !svgRef.current) return;
      drawImportTree(
         previewData.previewTree,
         selectedDbIds,
         handleToggleBranch,
         svgRef.current,
         zoomTransformRef
      );
   }, [previewData, selectedDbIds, handleToggleBranch]);

   const handleShowTree = async () => {
      if (!sourceFamilyId || !selectedFamily?.id) return;
      setLoadingPreview(true);
      setError('');
      setSuccess('');
      setPreviewData(null);
      setSelectedDbIds(new Set());
      zoomTransformRef.current = null;
      try {
         const data = await previewFamilyChainImport({
            targetFamilyId: selectedFamily.id,
            sourceFamilyId,
         });
         setPreviewData(data);
         setSelectedDbIds(collectDbIds(data.previewTree));
      } catch (err) {
         setError(err.message || 'Failed to load source tree');
      } finally {
         setLoadingPreview(false);
      }
   };

   const handleImport = async () => {
      if (!selectedFamily?.id || !sourceFamilyId || selectedDbIds.size === 0) return;
      setLoadingImport(true);
      setError('');
      setSuccess('');
      try {
         const result = await importFamilyChain({
            targetFamilyId: selectedFamily.id,
            sourceFamilyId,
            selectedPersonIds: Array.from(selectedDbIds),
         });
         setSuccess(
            `Imported ${result.imported} member${result.imported !== 1 ? 's' : ''}. ` +
            `${result.alreadyLinked} already linked.`
         );
         if (onImported) await onImported();
      } catch (err) {
         setError(err.message || 'Failed to import');
      } finally {
         setLoadingImport(false);
      }
   };

   return (
      <div style={S.wrap}>
         <h3 style={S.title}>Import Chain</h3>
         <p style={S.help}>
            Select a source family, view its full tree, deselect any branches you don&apos;t need,
            then click <strong>Import</strong> to link the selected persons into{' '}
            <strong>{selectedFamily?.name}</strong>.
         </p>

         {/* Source family picker + Show Tree */}
         <div style={S.row}>
            <div style={S.flex1}>
               <label style={S.label}>Source Family</label>
               <select
                  value={sourceFamilyId}
                  onChange={e => {
                     setSourceFamilyId(e.target.value);
                     setPreviewData(null);
                     setSelectedDbIds(new Set());
                     setError('');
                     setSuccess('');
                     zoomTransformRef.current = null;
                  }}
                  style={S.select}
               >
                  <option value="">Select source family...</option>
                  {sourceFamilies.map(f => (
                     <option key={f.id} value={f.id}>
                        {f.name}{f.region ? ` (${f.region})` : ''}
                     </option>
                  ))}
               </select>
            </div>
            <button
               onClick={handleShowTree}
               disabled={!sourceFamilyId || loadingPreview || loadingImport}
               style={{ ...S.btn, ...S.btnPrimary, opacity: (!sourceFamilyId || loadingPreview) ? 0.55 : 1 }}
            >
               {loadingPreview ? 'Loading\u2026' : 'Show Tree'}
            </button>
         </div>

         {error && <div style={S.errorBox}>{error}</div>}
         {success && <div style={S.successBox}>{success}</div>}

         {previewData && (
            <>
               {/* Stats bar */}
               <div style={S.statsBar}>
                  <span><strong>Total persons in tree:</strong> {previewData.counts?.total}</span>
                  <span><strong>Already in target:</strong> {previewData.counts?.alreadyLinked}</span>
                  <span style={{ color: '#2563eb' }}>
                     <strong>Selected for import:</strong> {selectedDbIds.size}
                  </span>
               </div>

               <p style={S.hint}>
                  Click any node or <strong>&minus;</strong> button to deselect that person and all
                  their descendants. Click again to re-select. Grayed-out nodes will not be imported.
               </p>

               {/* Tree viewport */}
               <div style={S.treeContainer}>
                  <svg ref={svgRef} style={S.treeSvg} />
               </div>

               {/* Footer actions */}
               <div style={S.footer}>
                  <button
                     onClick={() => setSelectedDbIds(collectDbIds(previewData.previewTree))}
                     style={{ ...S.btn, ...S.btnOutline }}
                  >
                     Select All
                  </button>
                  <button
                     onClick={() => setSelectedDbIds(new Set())}
                     style={{ ...S.btn, ...S.btnOutline }}
                  >
                     Deselect All
                  </button>
                  <button
                     onClick={handleImport}
                     disabled={loadingImport || selectedDbIds.size === 0}
                     style={{
                        ...S.btn, ...S.btnImport,
                        opacity: (loadingImport || selectedDbIds.size === 0) ? 0.55 : 1,
                     }}
                  >
                     {loadingImport
                        ? 'Importing\u2026'
                        : `Import ${selectedDbIds.size} member${selectedDbIds.size !== 1 ? 's' : ''}`}
                  </button>
               </div>
            </>
         )}
      </div>
   );
}


const S = {
   wrap: {
      background: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: 8,
      padding: 18,
   },
   title: { marginTop: 0, marginBottom: 8 },
   help: { marginTop: 0, marginBottom: 14, color: '#555', fontSize: 13, lineHeight: 1.5 },
   row: { display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14 },
   flex1: { flex: 1 },
   label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 },
   select: {
      width: '100%', padding: '9px 10px', borderRadius: 4,
      border: '1px solid #ccc', fontSize: 13, boxSizing: 'border-box',
   },
   btn: {
      padding: '9px 18px', borderRadius: 4, fontWeight: 700,
      fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', border: 'none',
   },
   btnPrimary: { background: '#1e3a8a', color: '#fff' },
   btnOutline: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
   btnImport: { background: '#16a34a', color: '#fff' },
   errorBox: {
      background: '#fee2e2', border: '1px solid #fca5a5',
      padding: '10px 14px', borderRadius: 4, marginBottom: 10, color: '#991b1b', fontSize: 13,
   },
   successBox: {
      background: '#d1fae5', border: '1px solid #6ee7b7',
      padding: '10px 14px', borderRadius: 4, marginBottom: 10, color: '#065f46', fontSize: 13,
   },
   statsBar: {
      background: '#eff6ff', border: '1px solid #bfdbfe',
      borderRadius: 4, padding: '8px 14px', marginBottom: 10,
      fontSize: 12, color: '#1e40af', display: 'flex', gap: 24, flexWrap: 'wrap',
   },
   hint: { fontSize: 12, color: '#64748b', marginTop: 0, marginBottom: 8 },
   treeContainer: {
      border: '1px solid #e2e8f0', borderRadius: 6,
      overflow: 'hidden', background: '#fff', height: 560,
   },
   treeSvg: { display: 'block', width: '100%', height: '100%' },
   footer: {
      marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap',
   },
};
