'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/types/site';
import { Globe, Save, CheckCircle, AlertCircle, Shield, Menu, Sliders, FileText, Share2, Layers } from 'lucide-react';

export default function AdminSiteCmsPage() {
  const { userProfile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'navigation' | 'pages' | 'homepage' | 'footer' | 'social'>('general');

  useEffect(() => {
    fetch('/api/admin/site')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setConfig({ ...DEFAULT_SITE_CONFIG, ...data });
        }
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg('Failed to load site configuration');
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update site configuration');
      setSuccessMsg('Global site configuration successfully updated and published.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5] flex font-sans">
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-md border-b border-[#1C1C1C] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-[#888888] hover:text-[#F5F5F5] border border-[#222222] bg-[#111111]"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#888888]">
                <Globe size={14} className="text-emerald-400" />
                <span>GLOBAL WEBSITE CMS</span>
              </div>
              <h1 className="font-display font-bold text-xl text-[#F5F5F5] tracking-wide mt-0.5">
                Site Control & Configuration
              </h1>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#F5F5F5] hover:bg-white text-[#080808] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Publish Changes'}</span>
          </button>
        </header>

        <div className="p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-8">
          {successMsg && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 font-mono text-xs flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-300 font-mono text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sub-navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[#1C1C1C] pb-4 font-mono text-xs">
            {[
              { id: 'general', label: 'General & SEO' },
              { id: 'navigation', label: 'Navigation' },
              { id: 'pages', label: 'Page Visibility' },
              { id: 'homepage', label: 'Homepage Sections' },
              { id: 'footer', label: 'Footer & Portals' },
              { id: 'social', label: 'Social Links' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 border transition-all uppercase tracking-wider ${
                  activeTab === tab.id
                    ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400 font-bold'
                    : 'border-[#222222] bg-[#111111] text-[#888888] hover:text-[#F5F5F5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center font-mono text-xs text-[#777777]">Loading site configuration...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <div className="space-y-6 bg-[#0D0D0D] border border-[#1C1C1C] p-6 sm:p-8">
                  <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase border-b border-[#1C1C1C] pb-3 flex items-center gap-2">
                    <Sliders size={14} className="text-emerald-400" />
                    <span>General Identity & SEO Metadata</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                    <div className="space-y-2">
                      <label className="block text-[#CCCCCC] uppercase">Site Name</label>
                      <input
                        type="text"
                        value={config.siteName || ''}
                        onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                        className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[#CCCCCC] uppercase">Default SEO Title</label>
                      <input
                        type="text"
                        value={config.defaultSeoTitle || ''}
                        onChange={(e) => setConfig({ ...config, defaultSeoTitle: e.target.value })}
                        className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <label className="block text-[#CCCCCC] uppercase">Site Description</label>
                    <textarea
                      rows={3}
                      value={config.siteDescription || ''}
                      onChange={(e) => setConfig({ ...config, siteDescription: e.target.value })}
                      className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555] font-sans text-sm"
                    />
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <label className="block text-[#CCCCCC] uppercase">Default SEO Description</label>
                    <textarea
                      rows={2}
                      value={config.defaultSeoDescription || ''}
                      onChange={(e) => setConfig({ ...config, defaultSeoDescription: e.target.value })}
                      className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555] font-sans text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                    <div className="space-y-2">
                      <label className="block text-[#CCCCCC] uppercase">OpenGraph (OG) Image URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={config.ogImage || ''}
                        onChange={(e) => setConfig({ ...config, ogImage: e.target.value })}
                        className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[#CCCCCC] uppercase">Copyright Text</label>
                      <input
                        type="text"
                        value={config.copyrightText || ''}
                        onChange={(e) => setConfig({ ...config, copyrightText: e.target.value })}
                        className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NAVIGATION TAB */}
              {activeTab === 'navigation' && (
                <div className="space-y-6 bg-[#0D0D0D] border border-[#1C1C1C] p-6 sm:p-8">
                  <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase border-b border-[#1C1C1C] pb-3 flex items-center gap-2">
                    <Menu size={14} className="text-emerald-400" />
                    <span>Navigation Manager</span>
                  </h3>

                  <div className="space-y-4">
                    {config.navigation.map((item, idx) => (
                      <div key={item.id} className="p-4 bg-[#141414] border border-[#222222] flex flex-col sm:flex-row items-center gap-4 font-mono text-xs">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <span className="text-[#666666]">#{item.order}</span>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => {
                              const updated = [...config.navigation];
                              updated[idx].label = e.target.value;
                              setConfig({ ...config, navigation: updated });
                            }}
                            className="bg-[#0A0A0A] border border-[#333333] px-3 py-2 text-[#F5F5F5] w-36"
                          />
                        </div>

                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            value={item.href}
                            onChange={(e) => {
                              const updated = [...config.navigation];
                              updated[idx].href = e.target.value;
                              setConfig({ ...config, navigation: updated });
                            }}
                            className="bg-[#0A0A0A] border border-[#333333] px-3 py-2 text-[#CCCCCC] w-full"
                          />
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => {
                                const updated = [...config.navigation];
                                updated[idx].enabled = e.target.checked;
                                setConfig({ ...config, navigation: updated });
                              }}
                              className="w-4 h-4 accent-emerald-500"
                            />
                            <span className={item.enabled ? 'text-emerald-400' : 'text-[#666666]'}>
                              {item.enabled ? 'ENABLED' : 'HIDDEN'}
                            </span>
                          </label>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const updated = [...config.navigation];
                                const temp = updated[idx];
                                updated[idx] = updated[idx - 1];
                                updated[idx - 1] = temp;
                                updated.forEach((it, i) => it.order = i + 1);
                                setConfig({ ...config, navigation: updated });
                              }}
                              className="px-2 py-1 bg-[#222222] text-xs disabled:opacity-30"
                            >
                              &uarr;
                            </button>
                            <button
                              type="button"
                              disabled={idx === config.navigation.length - 1}
                              onClick={() => {
                                const updated = [...config.navigation];
                                const temp = updated[idx];
                                updated[idx] = updated[idx + 1];
                                updated[idx + 1] = temp;
                                updated.forEach((it, i) => it.order = i + 1);
                                setConfig({ ...config, navigation: updated });
                              }}
                              className="px-2 py-1 bg-[#222222] text-xs disabled:opacity-30"
                            >
                              &darr;
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PAGE VISIBILITY TAB */}
              {activeTab === 'pages' && (
                <div className="space-y-6 bg-[#0D0D0D] border border-[#1C1C1C] p-6 sm:p-8">
                  <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase border-b border-[#1C1C1C] pb-3 flex items-center gap-2">
                    <FileText size={14} className="text-emerald-400" />
                    <span>Public Page Visibility Controls</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    {Object.entries(config.pageVisibility || {}).map(([pageKey, isEnabled]) => (
                      <div key={pageKey} className="p-4 bg-[#141414] border border-[#222222] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#F5F5F5] uppercase">/{pageKey}</span>
                          <p className="text-[11px] text-[#777777] mt-0.5">Controls accessibility of public {pageKey} view</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              pageVisibility: { ...config.pageVisibility, [pageKey]: !isEnabled },
                            })
                          }
                          className={`px-3 py-1.5 border font-bold uppercase transition-all ${
                            isEnabled
                              ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                              : 'border-red-900/50 bg-red-950/20 text-red-400'
                          }`}
                        >
                          {isEnabled ? 'ACTIVE' : 'DISABLED'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HOMEPAGE CMS TAB */}
              {activeTab === 'homepage' && (
                <div className="space-y-6 bg-[#0D0D0D] border border-[#1C1C1C] p-6 sm:p-8">
                  <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase border-b border-[#1C1C1C] pb-3 flex items-center gap-2">
                    <Layers size={14} className="text-emerald-400" />
                    <span>Homepage Content & Section Ordering</span>
                  </h3>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="space-y-2">
                      <label className="block text-[#CCCCCC] uppercase">Hero Title</label>
                      <input
                        type="text"
                        value={config.homepage?.heroTitle || ''}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            homepage: { ...config.homepage, heroTitle: e.target.value },
                          })
                        }
                        className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[#CCCCCC] uppercase">Hero Description</label>
                      <textarea
                        rows={3}
                        value={config.homepage?.heroDescription || ''}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            homepage: { ...config.homepage, heroDescription: e.target.value },
                          })
                        }
                        className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none font-sans text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1C1C1C] space-y-4">
                    <h4 className="font-mono text-xs text-[#888888] uppercase">Homepage Sections</h4>
                    {config.homepage?.sections?.map((sec, idx) => (
                      <div key={sec.id} className="p-4 bg-[#141414] border border-[#222222] flex items-center justify-between font-mono text-xs">
                        <div className="flex items-center gap-4">
                          <span className="text-[#666666]">#{sec.order}</span>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => {
                              const updated = [...config.homepage.sections];
                              updated[idx].title = e.target.value;
                              setConfig({
                                ...config,
                                homepage: { ...config.homepage, sections: updated },
                              });
                            }}
                            className="bg-[#0A0A0A] border border-[#333333] px-3 py-1.5 text-[#F5F5F5] w-48"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sec.enabled}
                            onChange={(e) => {
                              const updated = [...config.homepage.sections];
                              updated[idx].enabled = e.target.checked;
                              setConfig({
                                ...config,
                                homepage: { ...config.homepage, sections: updated },
                              });
                            }}
                            className="w-4 h-4 accent-emerald-500"
                          />
                          <span className={sec.enabled ? 'text-emerald-400' : 'text-[#666666]'}>
                            {sec.enabled ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FOOTER & PORTALS TAB */}
              {activeTab === 'footer' && (
                <div className="space-y-6 bg-[#0D0D0D] border border-[#1C1C1C] p-6 sm:p-8">
                  <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase border-b border-[#1C1C1C] pb-3 flex items-center gap-2">
                    <Share2 size={14} className="text-emerald-400" />
                    <span>Footer & Portal Access Buttons</span>
                  </h3>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="space-y-2">
                      <label className="block text-[#CCCCCC] uppercase">Footer Description</label>
                      <textarea
                        rows={3}
                        value={config.footer?.description || ''}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            footer: { ...config.footer, description: e.target.value },
                          })
                        }
                        className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none font-sans text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1C1C1C] space-y-4">
                    <h4 className="font-mono text-xs text-[#888888] uppercase">Portal Access Footer Buttons</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                      <div className="p-4 bg-[#141414] border border-[#222222] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#F5F5F5]">Admin Portal Button</span>
                          <input
                            type="checkbox"
                            checked={config.footer?.portalAccess?.admin?.enabled ?? true}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                footer: {
                                  ...config.footer,
                                  portalAccess: {
                                    ...config.footer.portalAccess,
                                    admin: {
                                      ...config.footer.portalAccess.admin,
                                      enabled: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                            className="w-4 h-4 accent-emerald-500"
                          />
                        </div>
                        <input
                          type="text"
                          value={config.footer?.portalAccess?.admin?.label || 'ADMIN PORTAL'}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              footer: {
                                ...config.footer,
                                portalAccess: {
                                  ...config.footer.portalAccess,
                                  admin: {
                                    ...config.footer.portalAccess.admin,
                                    label: e.target.value,
                                  },
                                },
                              },
                            })
                          }
                          className="w-full bg-[#0A0A0A] border border-[#333333] p-2 text-[#F5F5F5]"
                        />
                      </div>

                      <div className="p-4 bg-[#141414] border border-[#222222] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#F5F5F5]">Artist Portal Button</span>
                          <input
                            type="checkbox"
                            checked={config.footer?.portalAccess?.artist?.enabled ?? true}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                footer: {
                                  ...config.footer,
                                  portalAccess: {
                                    ...config.footer.portalAccess,
                                    artist: {
                                      ...config.footer.portalAccess.artist,
                                      enabled: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                            className="w-4 h-4 accent-emerald-500"
                          />
                        </div>
                        <input
                          type="text"
                          value={config.footer?.portalAccess?.artist?.label || 'ARTIST PORTAL'}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              footer: {
                                ...config.footer,
                                portalAccess: {
                                  ...config.footer.portalAccess,
                                  artist: {
                                    ...config.footer.portalAccess.artist,
                                    label: e.target.value,
                                  },
                                },
                              },
                            })
                          }
                          className="w-full bg-[#0A0A0A] border border-[#333333] p-2 text-[#F5F5F5]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SOCIAL LINKS TAB */}
              {activeTab === 'social' && (
                <div className="space-y-6 bg-[#0D0D0D] border border-[#1C1C1C] p-6 sm:p-8">
                  <h3 className="font-mono text-xs text-[#888888] tracking-widest uppercase border-b border-[#1C1C1C] pb-3 flex items-center gap-2">
                    <Share2 size={14} className="text-emerald-400" />
                    <span>Social & Channel URLs (HTTPS)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                    {Object.entries(config.footer?.socialLinks || {}).map(([platform, url]) => (
                      <div key={platform} className="space-y-2">
                        <label className="block text-[#CCCCCC] uppercase">{platform}</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={url || ''}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              footer: {
                                ...config.footer,
                                socialLinks: {
                                  ...config.footer.socialLinks,
                                  [platform]: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full bg-[#141414] border border-[#222222] p-3 text-[#F5F5F5] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
