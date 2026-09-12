import React from 'react';
import { MapPin, Navigation, Shield, Users, ArrowRight, Sparkles } from 'lucide-react';
import { ArtisanProfile } from '../types';

interface MakurdiZoneExplorerProps {
  artisans: ArtisanProfile[];
  selectedZone: string;
  onSelectZone: (zone: string) => void;
}

interface ZoneMeta {
  id: string;
  name: string;
  landmark: string;
  side: 'North of Benue River' | 'South of Benue River';
  color: string;
}

const ZONES: ZoneMeta[] = [
  {
    id: 'Wurukum',
    name: 'Wurukum & Roundabout',
    landmark: 'Central commercial axis, Wurukum market & bus terminals',
    side: 'South of Benue River',
    color: 'emerald',
  },
  {
    id: 'High Level',
    name: 'High Level',
    landmark: 'Judges Quarters, civil service hub, Otukpo Road',
    side: 'South of Benue River',
    color: 'teal',
  },
  {
    id: 'North Bank',
    name: 'North Bank',
    landmark: 'Across Old & New River Benue bridges, 72 Barracks',
    side: 'North of Benue River',
    color: 'blue',
  },
  {
    id: 'Kanshio',
    name: 'Kanshio Axis',
    landmark: 'Modern residential, along Makurdi-Otukpo expressway',
    side: 'South of Benue River',
    color: 'amber',
  },
  {
    id: 'Modern Market',
    name: 'Modern Market Axis',
    landmark: 'Trade center, building supplies, electronics wholesale',
    side: 'South of Benue River',
    color: 'purple',
  },
  {
    id: 'BSU Campus Area',
    name: 'BSU Campus Area',
    landmark: 'Benue State University community & student quarters',
    side: 'South of Benue River',
    color: 'indigo',
  },
  {
    id: 'Judges Quarters',
    name: 'Judges Quarters',
    landmark: 'High-density residential executive estates',
    side: 'South of Benue River',
    color: 'rose',
  },
  {
    id: 'Wadata',
    name: 'Wadata Riverbank',
    landmark: 'Fish market, riverside communities & artisan crafts',
    side: 'South of Benue River',
    color: 'cyan',
  },
];

export const MakurdiZoneExplorer: React.FC<MakurdiZoneExplorerProps> = ({
  artisans,
  selectedZone,
  onSelectZone,
}) => {
  const getArtisanCountForZone = (zoneName: string) => {
    return artisans.filter(
      (a) => a.serviceArea.includes(zoneName) || a.address.toLowerCase().includes(zoneName.toLowerCase())
    ).length;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span>Makurdi Geographic Hub</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            Explore Artisans by Makurdi Zone
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Click on any neighborhood to find artisans stationed closest to your doorstep for fastest arrival times.
          </p>
        </div>

        {selectedZone !== 'all' && (
          <button
            onClick={() => onSelectZone('all')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 self-start md:self-center"
          >
            Show All Makurdi Areas
          </button>
        )}
      </div>

      {/* Benue River Visual Divider Indicator */}
      <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between text-xs text-sky-900 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
          <span>
            <strong>River Benue Corridor:</strong> Artisans in our network seamlessly cross the Old and New Bridges to service both North Bank and South Metropolis.
          </span>
        </div>
        <span className="text-[11px] font-bold text-sky-700 hidden sm:block">100% City Coverage</span>
      </div>

      {/* Interactive Zone Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ZONES.map((zone) => {
          const count = getArtisanCountForZone(zone.id);
          const isSelected = selectedZone === zone.id;

          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(isSelected ? 'all' : zone.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between group cursor-pointer ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {count} {count === 1 ? 'pro' : 'pros'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800">
                  {zone.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {zone.landmark}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>{zone.side}</span>
                <ArrowRight
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform ${
                    isSelected ? 'translate-x-1 text-emerald-600' : 'group-hover:translate-x-1'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
