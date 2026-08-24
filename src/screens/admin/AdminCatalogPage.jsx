import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ImageOff, Package, Pencil, Plus, Search, Scissors, Tags, Trash2 } from 'lucide-react';
import { mediaUrl } from '../../api/config';
import { shop, shopAdmin } from '../../api/endpoints';
import { useToast } from '../../providers/ToastProvider';
import AdminShell from '../../components/admin/AdminShell';

const CONFIG = {
  products: { title: 'Products', singular: 'product', icon: Package, description: 'Ready-made pieces, stock and storefront photography.' },
  styles: { title: 'Styles', singular: 'style', icon: Scissors, description: 'Made-to-measure designs and image-led inspiration.' },
  categories: { title: 'Categories', singular: 'category', icon: Tags, description: 'Visual collections that guide customers through the catalogue.' },
};

const money = (value) => `GHS ${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
const sourceFor = (row) => mediaUrl(row?.primary_image?.image || row?.primary_image || row?.image);

export default function AdminCatalogPage({ kind }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const config = CONFIG[kind];
  const Icon = config.icon;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (kind === 'categories') {
        setRows(await shopAdmin.categories());
      } else {
        const response = kind === 'products'
          ? await shop.products({ page_size: 100 })
          : await shop.styles({ page_size: 100 });
        setRows(response?.results || []);
      }
    } catch (error) {
      showToast(error?.message || `Could not load ${config.title.toLowerCase()}.`, 'error');
    } finally {
      setLoading(false);
    }
  }, [kind, showToast, config.title]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(
    () => rows.filter((row) =>
      (!query || `${row.name} ${row.category_name || ''}`.toLowerCase().includes(query.toLowerCase()))
      && (status === 'all' || (status === 'active' ? row.is_active !== false : row.is_active === false))),
    [rows, query, status],
  );

  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return;
    try {
      if (kind === 'categories') await shopAdmin.deleteCategory(row.slug);
      else if (kind === 'products') await shopAdmin.deleteProduct(row.slug);
      else await shopAdmin.deleteStyle(row.slug);
      showToast(`${row.name} deleted.`, 'success');
      load();
    } catch (error) {
      showToast(error?.message || 'Could not delete this item.', 'error');
    }
  };

  return (
    <AdminShell
      eyebrow={<><Icon size={13} />Visual catalogue</>}
      title={config.title}
      subtitle={config.description}
      actions={(
        <button className="btn btn-primary" onClick={() => navigate(`/admin/${kind}/new`)}>
          <Plus size={16} />Add {config.singular}
        </button>
      )}
    >
      <div className="dash-toolbar">
        <div className="dash-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} />
        </div>
        <select className="dash-select" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All status</option>
          <option value="active">Live</option>
          <option value="hidden">Hidden</option>
        </select>
        <span className="dash-toolbar-meta">{visible.length} items</span>
      </div>

      {loading ? (
        <div className="dash-loading">Loading {config.title.toLowerCase()}…</div>
      ) : !visible.length ? (
        <div className="dash-empty">
          <ImageOff size={32} />
          <h3>No matching {config.title.toLowerCase()}</h3>
          <p>Add the first item or adjust the filters.</p>
        </div>
      ) : (
        <div className="dash-grid cat-grid">
          {visible.map((row) => {
            const src = sourceFor(row);
            return (
              <article className="cat-card" key={row.id}>
                <button className="cat-thumb" onClick={() => navigate(`/admin/${kind}/${row.slug}/edit`)}>
                  {src
                    ? <img src={src} alt={row.name} />
                    : <span className="cat-noimg"><ImageOff size={28} />No image</span>}
                  <span className={`cat-visibility ${row.is_active === false ? 'hidden' : ''}`}>
                    <Eye size={11} />{row.is_active === false ? 'Hidden' : 'Live'}
                  </span>
                </button>
                <div className="cat-body">
                  <div className="cat-title">
                    <div>
                      <h2>{row.name}</h2>
                      <p>{kind === 'categories' ? (row.full_path || row.name) : (row.category_name || 'Uncategorised')}</p>
                    </div>
                    <div className="cat-row-actions">
                      <button className="icon-btn" title="Edit" onClick={() => navigate(`/admin/${kind}/${row.slug}/edit`)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn btn-danger" title="Delete" onClick={() => remove(row)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="cat-meta">
                    <b>{kind === 'products' ? money(row.final_price || row.price) : kind === 'styles' ? money(row.base_price) : `${row.product_count || 0} products`}</b>
                    <span>{kind === 'products' ? `${row.stock_quantity || 0} in stock` : kind === 'styles' ? `${row.estimated_making_time || '-'} days` : `${row.style_count || 0} styles`}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
