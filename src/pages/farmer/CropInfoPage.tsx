import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Warehouse, IndianRupee, Leaf } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { PageContainer } from '../../components/common/PageContainer';
import { VoiceSpeaker } from '../../components/common/VoiceSpeaker';
import { MOCK_CROPS } from '../../data/mockCrops';
import { MOCK_CENTRES } from '../../data/mockCentres';

export const CropInfoPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const infoSpeech = language === 'te'
    ? `పంట సమాచారం. మీ ప్రాంతంలో అందుబాటులో ఉన్న పంటలు మరియు ప్రభుత్వ మద్దతు ధరలు ఇక్కడ చూడవచ్చు.`
    : `Crop information. Here you can see crops available in your area and their government support prices (MSP).`;

  return (
    <PageContainer
      title={language === 'te' ? 'పంట వివరాలు & ధరలు' : 'Crop Availability & MSP Prices'}
      subtitle={language === 'te' ? 'ప్రస్తుత సేకరణ కాలంలో అందుబాటులో ఉన్న పంటలు మరియు మద్దతు ధరలు' : 'Available crops this procurement season and government MSP rates'}
      showBackButton
      backTo="/farmer/dashboard"
      maxWidth="2xl"
    >
      {/* Informational note */}
      <div className="bg-agri-50 border border-agri-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-agri-800 mb-5">
        <span className="text-2xl flex-shrink-0">ℹ️</span>
        <div>
          <p className="font-bold">
            {language === 'te' ? 'ఇది సమాచారం మాత్రమే' : 'For information only'}
          </p>
          <p className="text-xs mt-0.5 text-agri-700">
            {language === 'te'
              ? 'ఏ పంట వేయాలో నిర్ణయించుకోవడం పూర్తిగా మీ ఇష్టం. ఇక్కడి సమాచారం మీకు సహాయపడటానికి మాత్రమే.'
              : 'The decision of which crop to grow or sell is entirely yours. This information is only to help you plan.'}
          </p>
        </div>
        <VoiceSpeaker text={infoSpeech} size="sm" className="ml-auto flex-shrink-0" />
      </div>

      {/* Crop Cards */}
      <div id="crop-info-cards" className="space-y-4">
        {MOCK_CROPS.map(crop => {
          const acceptingCentres = MOCK_CENTRES.filter(c => c.acceptedCropIds.includes(crop.id));
          const cropSpeech = language === 'te'
            ? `${crop.nativeNames['te'] || crop.name}. ప్రభుత్వ మద్దతు ధర: క్వింటాలుకి ₹${crop.mspPerQuintal.toLocaleString('en-IN')}. ${acceptingCentres.length} సేకరణ కేంద్రాలలో అందుబాటులో ఉంది.`
            : `${crop.name}. MSP Rate: Rupees ${crop.mspPerQuintal.toLocaleString('en-IN')} per quintal. Available at ${acceptingCentres.length} procurement centres nearby.`;

          return (
            <div key={crop.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-agri-300 transition-colors">
              {/* Crop Header */}
              <div className="flex items-center gap-4 p-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-agri-100 flex items-center justify-center text-3xl flex-shrink-0">
                  {crop.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900">{crop.name}</h3>
                    {language === 'te' && (
                      <span className="text-sm font-bold text-agri-700">{crop.nativeNames['te']}</span>
                    )}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${acceptingCentres.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                      {acceptingCentres.length > 0 ? `✓ ${acceptingCentres.length} Centres Available` : '✗ Not Available'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <IndianRupee size={14} className="text-agri-700" />
                    <span className="text-sm font-bold text-agri-900">
                      {crop.mspPerQuintal.toLocaleString('en-IN')} / Quintal
                    </span>
                    <span className="text-xs text-slate-500">(Govt. MSP)</span>
                  </div>
                </div>
                <VoiceSpeaker text={cropSpeech} size="sm" />
              </div>

              {/* Details */}
              <div className="p-4 space-y-3">
                {/* MSP & Moisture */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-agri-50 border border-agri-200 rounded-xl p-3">
                    <p className="text-slate-500 font-semibold">Govt. MSP Rate</p>
                    <p className="text-lg font-black text-agri-900">₹{crop.mspPerQuintal.toLocaleString('en-IN')}/Qt</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-slate-500 font-semibold">Max Moisture Allowed</p>
                    <p className="text-lg font-black text-blue-900">{crop.faqMoistureMax}%</p>
                  </div>
                </div>

                {/* Centres Accepting This Crop */}
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Warehouse size={13} />
                    Accepting Centres Nearby
                  </p>
                  {acceptingCentres.length > 0 ? (
                    <div className="space-y-1.5">
                      {acceptingCentres.map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Leaf size={13} className="text-agri-600" />
                            <span className="font-bold text-slate-800">{c.name.split('(')[0].trim()}</span>
                            <span className="text-slate-500">— {c.mandal}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{c.distanceKm} km</span>
                            <span className={`font-black uppercase text-[9px] px-1.5 py-0.5 rounded ${
                              c.operationalStatus === 'NORMAL' ? 'bg-green-100 text-green-800' :
                              c.operationalStatus === 'ATTENTION' ? 'bg-harvest-100 text-harvest-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {c.operationalStatus.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-red-600 font-semibold">
                      {language === 'te' ? 'ఈ సీజన్‌లో మీ ప్రాంతంలో ఈ పంట అందుబాటులో లేదు.' : 'This crop is not available at nearby centres this season.'}
                    </p>
                  )}
                </div>

                {/* Book CTA */}
                {acceptingCentres.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/farmer/book-slot')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-agri-700 hover:text-agri-900 border border-agri-300 bg-agri-50 hover:bg-agri-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Book Slot for {crop.name} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Genie tip */}
      <div className="mt-6 bg-agri-50 border border-agri-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-agri-800">
        <span className="text-2xl">🧞</span>
        <span className="font-semibold">
          {language === 'te'
            ? '"ఎంఎస్పీ ఎంత?" లేదా "ఏ పంట మంచిది?" అని జీనీని అడగండి.'
            : 'Ask Genie: "What is the MSP?" or "Which crop is best?" for instant answers.'}
        </span>
      </div>
    </PageContainer>
  );
};
