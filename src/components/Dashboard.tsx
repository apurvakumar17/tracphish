import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, Mail, Activity, ArrowUpRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Case } from '../types';
import { getStoredCases, mergeServerCases } from '../utils/storage';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>(() => getStoredCases());

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        const merged = mergeServerCases(data);
        setCases(merged);
      })
      .catch(err => {
        console.error("Failed to fetch cases from server, using local storage:", err);
        setCases(getStoredCases());
      });
  }, []);

  const stats = [
    { name: 'Emails Analyzed', value: cases.length.toString(), icon: Mail, color: 'text-blue-500' },
    { name: 'Threats Detected', value: cases.filter(c => c.threatScore > 50).length.toString(), icon: ShieldAlert, color: 'text-red-500' },
    { name: 'Active Campaigns', value: Array.from(new Set(cases.map(c => c.relatedCampaign).filter(Boolean))).length.toString(), icon: Activity, color: 'text-orange-500' },
    { name: 'Critical Cases', value: cases.filter(c => c.severity === 'Critical').length.toString(), icon: Users, color: 'text-purple-500' },
  ];

  const recentCases = cases.slice(-5).reverse();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Overview Dashboard</h2>
        <p className="text-slate-500 mt-1">Real-time threat intelligence and forensics overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-slate-400 text-sm font-medium">{stat.name}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-100">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200">Recent Investigations</h3>
            <Link to="/cases" className="text-sm text-blue-400 hover:text-blue-300 flex items-center">
              View all <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Case ID</th>
                  <th className="px-6 py-4 font-medium">Classification</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Score</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-300">{c.id}</td>
                    <td className="px-6 py-4 text-slate-300">{c.threatClassification}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                        c.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        c.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${c.threatScore > 80 ? 'bg-red-500' : c.threatScore > 50 ? 'bg-orange-500' : 'bg-green-500'}`} 
                            style={{ width: `${c.threatScore}%` }}
                          />
                        </div>
                        <span className="text-slate-400 font-mono">{c.threatScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/cases/${c.id}`} className="text-blue-400 hover:text-blue-300">Inspect</Link>
                    </td>
                  </tr>
                ))}
                {recentCases.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No recent cases found. Run an analysis to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-lg font-semibold text-slate-200">Global Infrastructure Map</h3>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-0 h-[400px] flex items-center justify-center relative overflow-hidden z-0">
              <MapContainer center={[20, 0]} zoom={1.5} className="dark-tiles" style={{ height: '100%', width: '100%', background: '#020617' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {cases.flatMap(c => c.geoLocations || []).map((geo, idx) => (
                  <Marker key={idx} position={[geo.lat, geo.lng]}>
                    <Popup className="bg-slate-900 border-slate-800 text-slate-200">
                      <strong>{geo.isProbableSource ? "Probable Source" : "Observed Infrastructure"}</strong><br/>
                      IP: {geo.ip}<br/>
                      Location: {geo.location}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
