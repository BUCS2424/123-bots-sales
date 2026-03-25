import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Briefcase, User, Mail, Phone, MapPin, Calendar, CheckCircle,
  Printer, Send, AlertCircle, Building2, Clock, FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from '../hooks/use-toast';
import { useSiteSettings } from '../context/SiteSettingsContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JobApplicationPage = () => {
  const { logoUrl, siteName } = useSiteSettings();
  const formRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  
  const [formData, setFormData] = useState({
    // Personal Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    date_of_birth: '',
    
    // Position Applied For
    applying_for_pawn: false,
    applying_for_storage: false,
    applying_for_rv: false,
    desired_position: '',
    desired_pay: '',
    available_start_date: '',
    
    // Availability
    available_monday: true,
    available_tuesday: true,
    available_wednesday: true,
    available_thursday: true,
    available_friday: true,
    available_saturday: false,
    available_sunday: false,
    
    // Employment History
    employment_history: [
      { company: '', position: '', start_date: '', end_date: '', reason_left: '' }
    ],
    
    // Education
    highest_education: '',
    school_name: '',
    graduation_year: '',
    
    // Additional Questions
    felony_conviction: false,
    felony_explanation: '',
    authorized_to_work: true,
    can_lift_50_lbs: true,
    valid_drivers_license: false,
    
    // References
    references: [
      { name: '', relationship: '', phone: '', years_known: '' },
      { name: '', relationship: '', phone: '', years_known: '' },
      { name: '', relationship: '', phone: '', years_known: '' }
    ],
    
    // Additional Info
    how_heard_about_us: '',
    additional_info: '',
    signature: '',
    signature_date: new Date().toISOString().split('T')[0]
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateEmploymentHistory = (index, field, value) => {
    const updated = [...formData.employment_history];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, employment_history: updated }));
  };

  const addEmploymentHistory = () => {
    setFormData(prev => ({
      ...prev,
      employment_history: [...prev.employment_history, { company: '', position: '', start_date: '', end_date: '', reason_left: '' }]
    }));
  };

  const updateReference = (index, field, value) => {
    const updated = [...formData.references];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, references: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one department selected
    if (!formData.applying_for_pawn && !formData.applying_for_storage && !formData.applying_for_rv) {
      toast({
        title: 'Please select at least one department',
        description: 'You must select which department(s) you are applying for.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API}/hr/applications`, formData);
      setApplicationId(response.data.id);
      setSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: 'Thank you for your application. We will review it and contact you soon.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to submit application. Please try again.',
        variant: 'destructive'
      });
    }
    setSubmitting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in joining 123Bots. 
              We have received your application and will review it shortly.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Application ID: <span className="font-mono">{applicationId}</span>
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/">
                <Button variant="outline">Return to Website</Button>
              </Link>
              <Button onClick={() => { setSubmitted(false); setFormData({ ...formData }); }} className="bg-[#c41e3a]">
                Submit Another Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 print:mb-4">
          <img
            src={logoUrl || '/images/gingerkare-logo.png'}
            alt={siteName || '123Bots'}
            className="h-16 mx-auto mb-4 print:h-12"
            data-testid="job-application-header-logo"
          />
          <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">Employment Application</h1>
          <p className="text-gray-600 mt-2">123Bots • Dothan, Alabama</p>
        </div>

        {/* Print Button */}
        <div className="flex justify-end mb-4 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Application
          </Button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="bg-[#1e3a5f] text-white rounded-t-lg print:bg-gray-800">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => updateField('first_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => updateField('last_name', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Street Address *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code *</Label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => updateField('zip_code', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => updateField('date_of_birth', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position Applied For */}
          <Card>
            <CardHeader className="bg-[#c41e3a] text-white rounded-t-lg print:bg-gray-800">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Position Applied For
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Which department(s) are you applying for? *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Checkbox
                      checked={formData.applying_for_pawn}
                      onCheckedChange={(checked) => updateField('applying_for_pawn', checked)}
                    />
                    <div>
                      <p className="font-medium text-amber-700">Products</p>
                      <p className="text-sm text-gray-500">Sales, customer service, inventory</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Checkbox
                      checked={formData.applying_for_storage}
                      onCheckedChange={(checked) => updateField('applying_for_storage', checked)}
                    />
                    <div>
                      <p className="font-medium text-[#c41e3a]">Storage Units</p>
                      <p className="text-sm text-gray-500">Rental management, maintenance</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Checkbox
                      checked={formData.applying_for_rv}
                      onCheckedChange={(checked) => updateField('applying_for_rv', checked)}
                    />
                    <div>
                      <p className="font-medium text-[#1e3a5f]">RV Restoration</p>
                      <p className="text-sm text-gray-500">Repairs, restoration, technician</p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Desired Position</Label>
                  <Input
                    value={formData.desired_position}
                    onChange={(e) => updateField('desired_position', e.target.value)}
                    placeholder="e.g., Sales Associate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desired Pay Rate</Label>
                  <Input
                    value={formData.desired_pay}
                    onChange={(e) => updateField('desired_pay', e.target.value)}
                    placeholder="e.g., $15/hour"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Start Date</Label>
                  <Input
                    type="date"
                    value={formData.available_start_date}
                    onChange={(e) => updateField('available_start_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader className="bg-purple-600 text-white rounded-t-lg print:bg-gray-800">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">What days are you available to work?</Label>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                {[
                  { key: 'available_monday', label: 'Mon' },
                  { key: 'available_tuesday', label: 'Tue' },
                  { key: 'available_wednesday', label: 'Wed' },
                  { key: 'available_thursday', label: 'Thu' },
                  { key: 'available_friday', label: 'Fri' },
                  { key: 'available_saturday', label: 'Sat' },
                  { key: 'available_sunday', label: 'Sun' }
                ].map(day => (
                  <label
                    key={day.key}
                    className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData[day.key] ? 'bg-purple-100 border-purple-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      checked={formData[day.key]}
                      onCheckedChange={(checked) => updateField(day.key, checked)}
                      className="mb-1"
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Employment History */}
          <Card>
            <CardHeader className="bg-emerald-600 text-white rounded-t-lg print:bg-gray-800">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Employment History
              </CardTitle>
              <CardDescription className="text-emerald-100">List your most recent employers (most recent first)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {formData.employment_history.map((job, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Employer {index + 1}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={job.company}
                        onChange={(e) => updateEmploymentHistory(index, 'company', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position/Title</Label>
                      <Input
                        value={job.position}
                        onChange={(e) => updateEmploymentHistory(index, 'position', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={job.start_date}
                        onChange={(e) => updateEmploymentHistory(index, 'start_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={job.end_date}
                        onChange={(e) => updateEmploymentHistory(index, 'end_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason for Leaving</Label>
                      <Input
                        value={job.reason_left}
                        onChange={(e) => updateEmploymentHistory(index, 'reason_left', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addEmploymentHistory} className="w-full print:hidden">
                + Add Another Employer
              </Button>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader className="bg-blue-600 text-white rounded-t-lg print:bg-gray-800">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Highest Level of Education</Label>
                  <select
                    value={formData.highest_education}
                    onChange={(e) => updateField('highest_education', e.target.value)}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="">Select...</option>
                    <option value="some_high_school">Some High School</option>
                    <option value="high_school">High School Diploma/GED</option>
                    <option value="some_college">Some College</option>
                    <option value="associates">Associate's Degree</option>
                    <option value="bachelors">Bachelor's Degree</option>
                    <option value="masters">Master's Degree</option>
                    <option value="doctorate">Doctorate</option>
                    <option value="trade_school">Trade/Vocational School</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input
                    value={formData.school_name}
                    onChange={(e) => updateField('school_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input
                    value={formData.graduation_year}
                    onChange={(e) => updateField('graduation_year', e.target.value)}
                    placeholder="e.g., 2020"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Questions */}
          <Card>
            <CardHeader className="bg-gray-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Additional Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.authorized_to_work}
                    onCheckedChange={(checked) => updateField('authorized_to_work', checked)}
                    className="mt-1"
                  />
                  <span>Are you legally authorized to work in the United States? *</span>
                </label>
                
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.can_lift_50_lbs}
                    onCheckedChange={(checked) => updateField('can_lift_50_lbs', checked)}
                    className="mt-1"
                  />
                  <span>Are you able to lift up to 50 pounds?</span>
                </label>
                
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.valid_drivers_license}
                    onCheckedChange={(checked) => updateField('valid_drivers_license', checked)}
                    className="mt-1"
                  />
                  <span>Do you have a valid driver's license?</span>
                </label>
                
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={formData.felony_conviction}
                    onCheckedChange={(checked) => updateField('felony_conviction', checked)}
                    className="mt-1"
                  />
                  <span>Have you ever been convicted of a felony?</span>
                </label>
                
                {formData.felony_conviction && (
                  <div className="ml-6 space-y-2">
                    <Label>Please explain:</Label>
                    <Textarea
                      value={formData.felony_explanation}
                      onChange={(e) => updateField('felony_explanation', e.target.value)}
                      placeholder="A conviction does not necessarily disqualify you from employment..."
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* References */}
          <Card>
            <CardHeader className="bg-amber-600 text-white rounded-t-lg print:bg-gray-800">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                References
              </CardTitle>
              <CardDescription className="text-amber-100">Please provide three professional references (not relatives)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {formData.references.map((ref, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="font-medium text-gray-700 mb-3">Reference {index + 1}</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={ref.name}
                        onChange={(e) => updateReference(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input
                        value={ref.relationship}
                        onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                        placeholder="e.g., Former Supervisor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        type="tel"
                        value={ref.phone}
                        onChange={(e) => updateReference(index, 'phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Years Known</Label>
                      <Input
                        value={ref.years_known}
                        onChange={(e) => updateReference(index, 'years_known', e.target.value)}
                        placeholder="e.g., 3 years"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* How did you hear about us */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>How did you hear about this position?</Label>
                <select
                  value={formData.how_heard_about_us}
                  onChange={(e) => updateField('how_heard_about_us', e.target.value)}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="">Select...</option>
                  <option value="website">Company Website</option>
                  <option value="indeed">Indeed</option>
                  <option value="facebook">Facebook</option>
                  <option value="referral">Employee Referral</option>
                  <option value="walk_in">Walk-In</option>
                  <option value="sign">Sign/Banner</option>
                  <option value="newspaper">Newspaper</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Additional Information</Label>
                <Textarea
                  value={formData.additional_info}
                  onChange={(e) => updateField('additional_info', e.target.value)}
                  placeholder="Is there anything else you would like us to know about you?"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Signature */}
          <Card>
            <CardHeader className="bg-gray-900 text-white rounded-t-lg">
              <CardTitle>Certification & Signature</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-gray-600">
                I certify that the information contained in this application is true and complete. 
                I understand that false information may be grounds for not hiring me or for immediate 
                termination of employment at any point in the future if I am hired. I authorize the 
                verification of any or all information listed above.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Signature (Type your full name) *</Label>
                  <Input
                    value={formData.signature}
                    onChange={(e) => updateField('signature', e.target.value)}
                    placeholder="Type your full legal name"
                    required
                    className="font-cursive italic"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.signature_date}
                    onChange={(e) => updateField('signature_date', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
            <Button type="button" variant="outline" size="lg" onClick={handlePrint}>
              <Printer className="w-5 h-5 mr-2" />
              Print Application
            </Button>
            <Button type="submit" size="lg" className="bg-[#c41e3a] hover:bg-[#a01830]" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm print:hidden">
          <p>123Bots is an Equal Opportunity Employer</p>
          <p className="mt-2">
            <Link to="/" className="text-[#c41e3a] hover:underline">Return to Website</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationPage;
