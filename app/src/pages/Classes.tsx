import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import profilesData from '../data/Profils.json';
import type { Profile } from '../types';
import { Search } from 'lucide-react';

const profiles = profilesData as Profile[];

export const Classes: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProfiles = useMemo(() => {
        return profiles.filter(profile =>
            profile.Profil.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20 sticky top-0 z-10 backdrop-blur-md">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500 mb-6">
                    Classes (Profils)
                </h1>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher une classe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-stone-900/50 border border-primary-500/20 rounded-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-all"
                    />
                </div>

                <div className="mt-4 text-sm text-stone-400">
                    {filteredProfiles.length} classe{filteredProfiles.length > 1 ? 's' : ''} trouvée{filteredProfiles.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Classes Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfiles.map((profile, index) => (
                    <Link
                        key={index}
                        to={`/classes/${index}`}
                        className="glass-panel rounded-xl border border-white/5 hover:border-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/10 group overflow-hidden"
                    >
                        {/* Class Image */}
                        <div className="relative h-48 overflow-hidden bg-stone-900/50">
                            <img
                                src={`/assets/profils/${profile.Profil}.jpg`}
                                alt={profile.Profil}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-transparent"></div>
                        </div>

                        <div className="p-6 relative -mt-8">
                            <h3 className="text-xl font-display font-bold text-primary-300 mb-3 group-hover:text-primary-200 transition-colors">
                                {profile.Profil}
                            </h3>

                            <p className="text-sm text-stone-400 leading-relaxed line-clamp-3">
                                {profile.Description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredProfiles.length === 0 && (
                <div className="glass-panel p-12 rounded-xl text-center">
                    <p className="text-stone-400 text-lg">Aucune classe trouvée</p>
                </div>
            )}
        </div>
    );
};
