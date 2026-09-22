import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Warehouse, Lock, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PageContainer } from '../components/common/PageContainer';
import { FormField } from '../components/common/FormField';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { StepProgressBar } from '../components/common/StepProgressBar';
import { MOCK_CROPS } from '../data/mockCrops';
import { MOCK_CENTRES } from '../data/mockCentres';

export const RegisterPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Kurnool');
  const [selectedCrop, setSelectedCrop] = useState(MOCK_CROPS[0].id);
  const [quantity, setQuantity] = useState('40');
  const [selectedCentre, setSelectedCentre] = useState(MOCK_CENTRES[0].id);
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');

  const steps = [
    { id: 1, title: t('register.step1_title') },
    { id: 2, title: t('register.step2_title') },
    { id: 3, title: t('register.step3_title') }
  ];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      setError('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!quantity || Number(quantity) <= 0) {
        setError('Please enter estimated crop quantity in quintals.');
        return;
      }
      setError('');
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Complete Registration
      register({
        name,
        phone,
        village: village || 'Rampur Village',
        district: district || 'Kurnool',
        bankAccountMasked: '•••• •••• ' + phone.slice(-4),
        bankName: 'State Bank of India',
        ifscMasked: 'SBIN000••••'
      });
      navigate('/farmer/dashboard');
    }
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  return (
    <PageContainer
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      showBackButton={true}
      backTo="/login"
      maxWidth="lg"
    >
      <div className="bg-white border-2 border-agri-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <StepProgressBar steps={steps} currentStep={currentStep} />

        <form onSubmit={handleNext} id="register-form" className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-sm font-bold">
              {error}
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <FormField
                id="reg-name"
                label={t('register.name_label')}
                labelVoiceKey="register.name_label"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('register.name_placeholder')}
                helperText={t('register.name_help')}
                helperVoiceText={t('register.name_help')}
                icon={<User size={20} />}
                required
              />

              <FormField
                id="reg-phone"
                label={t('register.phone_label')}
                labelVoiceKey="register.phone_label"
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('register.phone_placeholder')}
                helperText={t('register.phone_help')}
                helperVoiceText={t('register.phone_help')}
                icon={<Phone size={20} />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="reg-village"
                  label={t('register.village_label')}
                  labelVoiceKey="register.village_label"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder={t('register.village_placeholder')}
                  icon={<MapPin size={20} />}
                />

                <FormField
                  id="reg-district"
                  label={t('register.district_label')}
                  labelVoiceKey="register.district_label"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={t('register.district_placeholder')}
                  icon={<MapPin size={20} />}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Crop Details */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-base sm:text-lg font-bold text-slate-900 block">
                  {t('register.crop_label')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOCK_CROPS.map((crop) => {
                    const isSelected = selectedCrop === crop.id;
                    const cropDisplayName = crop.nativeNames[language] || crop.name;

                    return (
                      <div
                        key={crop.id}
                        onClick={() => setSelectedCrop(crop.id)}
                        className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-agri-600 bg-agri-50 ring-2 ring-agri-400 font-bold'
                            : 'border-slate-200 bg-white hover:border-agri-300'
                        }`}
                      >
                        <span className="text-3xl">{crop.icon}</span>
                        <div>
                          <div className="text-base text-slate-900">{cropDisplayName}</div>
                          <div className="text-xs text-agri-800 font-bold">
                            MSP: ₹{crop.mspPerQuintal.toLocaleString('en-IN')}/Qt
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <FormField
                id="reg-quantity"
                label={t('register.quantity_label')}
                labelVoiceKey="register.quantity_label"
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t('register.quantity_placeholder')}
                helperText={t('register.quantity_help')}
                helperVoiceText={t('register.quantity_help')}
                required
              />
            </div>
          )}

          {/* STEP 3: Centre & PIN */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <FormField
                id="reg-centre"
                label={t('register.centre_label')}
                labelVoiceKey="register.centre_label"
                as="select"
                value={selectedCentre}
                onChange={(e) => setSelectedCentre(e.target.value)}
                icon={<Warehouse size={20} />}
                options={MOCK_CENTRES.map((c) => ({
                  value: c.id,
                  label: c.name,
                  sublabel: `${c.distanceKm} km away`
                }))}
              />

              <FormField
                id="reg-pin"
                label={t('register.pin_label')}
                labelVoiceKey="register.pin_label"
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={t('register.pin_placeholder')}
                icon={<Lock size={20} />}
                required
              />

              <div className="p-4 bg-agri-50 border border-agri-300 rounded-2xl flex items-start gap-3 text-sm text-agri-950 font-medium">
                <CheckCircle2 size={24} className="text-agri-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-agri-900 font-bold">Instant Direct Token Generation</strong>
                  After registering, your farmer profile will be activated immediately and you can book a procurement date.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
            {currentStep > 1 ? (
              <PrimaryButton
                type="button"
                onClick={handlePrev}
                variant="outline"
                size="md"
                icon={<ArrowLeft size={20} />}
                fullWidth={false}
              >
                {t('register.back_btn')}
              </PrimaryButton>
            ) : (
              <div />
            )}

            <PrimaryButton
              type="submit"
              size="lg"
              variant="primary"
              icon={currentStep === 3 ? <CheckCircle2 size={22} /> : <ArrowRight size={22} />}
              fullWidth={currentStep === 1}
            >
              {currentStep === 3 ? t('register.submit_btn') : t('register.next_btn')}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};
