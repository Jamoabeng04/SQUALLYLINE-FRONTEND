import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, Crown, ImagePlus, Images, Info, Loader2,
  Save, Trash2, UploadCloud, X,
} from 'lucide-react';
import { mediaUrl } from '../../api/config';
import { shopAdmin } from '../../api/endpoints';
import { useToast } from '../../providers/ToastProvider';

const CONFIG = {
  products: { singular: 'product', label: 'Product', studioHint: 'Lead with the strongest image, then add angles, details and fabric close-ups.' },
  styles: { singular: 'style', label: 'Style', studioHint: 'Lead with the strongest image, then add angles, details and fabric close-ups.' },
  categories: { singular: 'category', label: 'Category', studioHint: 'Choose one strong collection cover.' },
};

const EMPTY = {
  name: '', slug: '', description: '', category: '', parent: '', gender: 'U',
  price: '', discount_price: '', base_price: '', stock_quantity: 0,
  estimated_making_time: '', video_link: '',
  is_active: true, is_featured: false, is_in_stock: true, is_customizable: true,
};

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 12 * 1024 * 1024;

const AUDIENCE = [
  { value: 'U', label: 'Unisex' },
  { value: 'M', label: 'Men' },
  { value: 'F', label: 'Women' },
  { value: 'K', label: 'Kids' },
];

export default function AdminCatalogEditor() {
  const { kind, slug } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInput = useRef();
  const filesRef = useRef([]);

  const config = CONFIG[kind];
  const editing = Boolean(slug);

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [categoryImageRemoved, setCategoryImageRemoved] = useState(false);

  const back = useCallback(() => navigate(`/admin/${kind}`), [navigate, kind]);

  const load = useCallback(async () => {
    if (!config) {
      navigate('/admin', { replace: true });
      return;
    }
    try {
      const cats = await shopAdmin.categories();
      setCategories(cats);

      if (editing) {
        const row =
          kind === 'products' ? await shopAdmin.product(slug)
          : kind === 'styles' ? await shopAdmin.style(slug)
          : await shopAdmin.category(slug);

        setForm({ ...EMPTY, ...row, category: row.category || '', parent: row.parent || '' });
        setExistingImages(
          kind === 'categories'
            ? (row.image ? [{ id: 'category', image: row.image, is_primary: true, alt_text: row.name }] : [])
            : row.images || [],
        );
      }
    } catch (error) {
      showToast(error?.message || 'Could not load this item.', 'error');
      back();
    } finally {
      setLoading(false);
    }
  }, [config, editing, kind, slug, showToast, navigate, back]);

  useEffect(() => { load(); }, [load]);

  // Keep a ref of queued files so the unmount cleanup can revoke every preview
  // URL without re-subscribing on each change.
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => () => filesRef.current.forEach((item) => URL.revokeObjectURL(item.preview)), []);

  const addFiles = (incoming) => {
    const next = [...incoming]
      .filter((file) => ACCEPTED.includes(file.type) && file.size <= MAX_BYTES)
      .map((file) => ({ file, preview: URL.createObjectURL(file), alt: form.name }));

    const limit = kind === 'categories' ? 1 : 12 - existingImages.length;
    setFiles((current) =>
      [...current, ...next].slice(
        kind === 'categories' ? -1 : 0,
        kind === 'categories' ? undefined : limit,
      ),
    );

    if (kind === 'categories' && next.length) setCategoryImageRemoved(false);
    if (next.length !== incoming.length) showToast('Use JPG, PNG or WebP images under 12 MB.', 'info');
  };

  const removeQueued = (index) =>
    setFiles((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });

  const updateExisting = async (image, payload) => {
    const fn = kind === 'products' ? shopAdmin.updateProductImage : shopAdmin.updateStyleImage;
    const response = await fn(slug, image.id, payload);
    const updated = response.image || response;
    setExistingImages((current) =>
      current.map((item) =>
        item.id === image.id ? updated : (payload.is_primary ? { ...item, is_primary: false } : item),
      ),
    );
  };

  const removeExisting = async (image) => {
    if (!window.confirm('Remove this image permanently?')) return;
    if (kind === 'categories') {
      setExistingImages([]);
      setCategoryImageRemoved(true);
      return;
    }
    const fn = kind === 'products' ? shopAdmin.deleteProductImage : shopAdmin.deleteStyleImage;
    await fn(slug, image.id);
    setExistingImages((current) => current.filter((item) => item.id !== image.id));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      const keys =
        kind === 'categories'
          ? ['name', 'slug', 'description', 'parent', 'is_active']
          : kind === 'products'
            ? ['name', 'slug', 'description', 'category', 'gender', 'price', 'discount_price', 'stock_quantity', 'is_in_stock', 'is_active', 'is_featured']
            : ['name', 'slug', 'description', 'category', 'gender', 'base_price', 'estimated_making_time', 'video_link', 'is_customizable', 'is_active', 'is_featured'];

      keys.forEach((key) => {
        if (form[key] !== '' && form[key] != null) data.append(key, form[key]);
      });

      const firstFile = files[0]?.file;
      if (firstFile) data.append(kind === 'categories' ? 'image' : 'primary_image', firstFile);
      if (kind === 'categories' && categoryImageRemoved && !firstFile) data.append('remove_image', 'true');

      let response;
      if (kind === 'categories') {
        response = editing ? await shopAdmin.updateCategory(slug, data) : await shopAdmin.createCategory(data);
      } else if (kind === 'products') {
        response = editing ? await shopAdmin.updateProduct(slug, data) : await shopAdmin.createProduct(data);
      } else {
        response = editing ? await shopAdmin.updateStyle(slug, data) : await shopAdmin.createStyle(data);
      }

      const saved = response?.[config.singular] || response;
      const savedSlug = saved?.slug || form.slug;

      // Any images beyond the cover go up as a gallery batch.
      const remaining = firstFile ? files.slice(1) : files;
      if (kind !== 'categories' && remaining.length) {
        const gallery = new FormData();
        remaining.forEach((item) => gallery.append('images', item.file));
        if (kind === 'products') await shopAdmin.uploadProductImages(savedSlug, gallery);
        else await shopAdmin.uploadStyleImages(savedSlug, gallery);
      }

      showToast(`${form.name} saved and images processed.`, 'success');
      navigate(`/admin/${kind}`);
    } catch (error) {
      showToast(error?.message || 'Could not save this item.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalImages = existingImages.length + files.length;
  const canAdd = kind === 'categories' ? totalImages < 1 : totalImages < 12;

  const field = (key, label, props = {}) => (
    <label className="dash-field">
      <span>{label}{props.required && <b>Required</b>}</span>
      <input
        {...props}
        value={form[key] ?? ''}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
      />
    </label>
  );

  if (loading) {
    return (
      <div className="ce-loading">
        <Loader2 className="spin" size={20} />
        Preparing the visual editor…
      </div>
    );
  }

  return (
    <main className="ce-page mw-shell">
      {/* Sticky action bar — back, context and save stay reachable while the
          long form scrolls. */}
      <header className="ce-bar">
        <button className="icon-btn" onClick={back} aria-label="Back to catalogue">
          <ArrowLeft size={18} />
        </button>
        <div className="ce-bar-title">
          <span>{config.label} editor</span>
          <h1>{editing ? form.name || `Edit ${config.singular}` : `New ${config.singular}`}</h1>
        </div>
        <span className="ce-bar-status">
          <Check size={14} />
          Web-ready image processing
        </span>
        <button className="btn btn-primary" form="ce-form" disabled={saving}>
          {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save & publish'}
        </button>
      </header>

      <form id="ce-form" onSubmit={save} className="ce-layout">
        {/* ---------------------------------------------------- image studio */}
        <section className="ce-studio dash-panel">
          <div className="dash-section-head">
            <div>
              <span className="dash-eyebrow">Step 01</span>
              <h2>Imagery</h2>
            </div>
            <p>{config.studioHint}</p>
          </div>

          <div
            className={`ce-dropzone ${dragging ? 'dragging' : ''} ${!canAdd ? 'disabled' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); if (canAdd) addFiles(event.dataTransfer.files); }}
            onClick={() => canAdd && fileInput.current?.click()}
          >
            <input
              ref={fileInput}
              hidden
              type="file"
              multiple={kind !== 'categories'}
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => addFiles(event.target.files)}
            />
            <UploadCloud size={26} />
            <strong>Drop high-resolution images here</strong>
            <span>JPG, PNG or WebP · 12 MB max · auto-converted to WebP</span>
          </div>

          <div className="ce-gallery">
            {existingImages.map((image) => (
              <article className={`ce-tile ${image.is_primary ? 'primary' : ''}`} key={image.id}>
                <img src={mediaUrl(image.image)} alt={image.alt_text || form.name} />
                {image.is_primary && <span className="ce-badge"><Crown size={12} />Cover</span>}
                <div className="ce-tile-actions">
                  {kind !== 'categories' && !image.is_primary && (
                    <button type="button" title="Make cover" onClick={() => updateExisting(image, { is_primary: true })}>
                      <Crown size={15} />
                    </button>
                  )}
                  <button type="button" title="Delete image" onClick={() => removeExisting(image)}>
                    <Trash2 size={15} />
                  </button>
                </div>
                {kind !== 'categories' && (
                  <input
                    aria-label="Image description"
                    defaultValue={image.alt_text || ''}
                    placeholder="Describe this image"
                    onBlur={(event) => event.target.value !== image.alt_text && updateExisting(image, { alt_text: event.target.value })}
                  />
                )}
              </article>
            ))}

            {files.map((item, index) => (
              <article className={`ce-tile queued ${!existingImages.length && index === 0 ? 'primary' : ''}`} key={item.preview}>
                <img src={item.preview} alt="Upload preview" />
                {!existingImages.length && index === 0 && <span className="ce-badge"><Crown size={12} />Cover</span>}
                <button className="ce-remove" type="button" onClick={() => removeQueued(index)}>
                  <X size={15} />
                </button>
                <span className="ce-processing"><ImagePlus size={12} />Ready to process</span>
              </article>
            ))}

            {!totalImages && (
              <div className="ce-gallery-empty">
                <Images size={30} />
                <strong>No imagery yet</strong>
                <span>A fashion item without photography should stay hidden.</span>
              </div>
            )}
          </div>
        </section>

        {/* -------------------------------------------------------- details */}
        <section className="ce-panel dash-panel">
          <div className="dash-section-head">
            <div>
              <span className="dash-eyebrow">Step 02</span>
              <h2>Details</h2>
            </div>
            <p>Keep the language short, specific and useful.</p>
          </div>

          {field('name', 'Name', { required: true, placeholder: 'Editorial product name' })}
          {field('slug', 'URL slug', { required: true, placeholder: 'editorial-product-name' })}

          <label className="dash-field">
            <span>Description</span>
            <textarea
              value={form.description || ''}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe the cut, fabric, feel and occasion."
            />
          </label>

          {kind === 'categories' ? (
            <label className="dash-field">
              <span>Parent collection</span>
              <select value={form.parent || ''} onChange={(event) => setForm({ ...form, parent: event.target.value })}>
                <option value="">Top-level collection</option>
                {categories.filter((category) => category.id !== form.id).map((category) => (
                  <option value={category.id} key={category.id}>{category.full_path || category.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="dash-field">
                <span>Category{<b>Required</b>}</span>
                <select required value={form.category || ''} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option value={category.id} key={category.id}>{category.full_path || category.name}</option>
                  ))}
                </select>
              </label>

              <div className="dash-field">
                <span>Audience</span>
                <div className="dash-segment" role="group" aria-label="Audience">
                  {AUDIENCE.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={form.gender === option.value ? 'active' : ''}
                      onClick={() => setForm({ ...form, gender: option.value })}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dash-field-row">
                {field(kind === 'products' ? 'price' : 'base_price', kind === 'products' ? 'Price' : 'Base price', { required: true, type: 'number', min: 0, step: '.01' })}
                {kind === 'products'
                  ? field('discount_price', 'Sale price', { type: 'number', min: 0, step: '.01' })
                  : field('estimated_making_time', 'Making days', { type: 'number', min: 1 })}
              </div>

              {kind === 'products' && (
                <div className="dash-field-row">
                  {field('stock_quantity', 'Stock quantity', { type: 'number', min: 0 })}
                </div>
              )}
              {kind === 'styles' && field('video_link', 'Optional video link', { type: 'url', placeholder: 'https://…' })}
            </>
          )}

          <div className="dash-toggles">
            <label className="dash-toggle">
              <input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
              <span>
                <b>Visible to customers</b>
                <small>Only publish when the imagery and details are ready.</small>
              </span>
            </label>
            {kind !== 'categories' && (
              <label className="dash-toggle">
                <input type="checkbox" checked={Boolean(form.is_featured)} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} />
                <span>
                  <b>Featured</b>
                  <small>Give this item additional storefront prominence.</small>
                </span>
              </label>
            )}
          </div>

          <p className="ce-hint"><Info size={14} />Images are optimised and converted to WebP automatically after saving.</p>
        </section>
      </form>
    </main>
  );
}
