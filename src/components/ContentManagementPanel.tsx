import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, Eye, FileText, Briefcase, Upload, Download, ExternalLink } from '@/lib/icons';

interface PressRelease {
  id: string;
  title: string;
  description: string;
  content: string;
  date: string;
  category: string;
  link?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  remote: boolean;
  description: string;
  requirements?: string;
  benefits?: string;
  salary_range?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CompanyInfo {
  id: string;
  section: string;
  title?: string;
  content?: string;
  data: Record<string, any>;
  updated_at: string;
}

const ContentManagementPanel = () => {
  const { toast } = useToast();
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo[]>([]);
  const [pressFiles, setPressFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [pressDialogOpen, setPressDialogOpen] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingPress, setEditingPress] = useState<PressRelease | null>(null);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyInfo | null>(null);

  // Form states
  const [pressForm, setPressForm] = useState({
    title: '',
    description: '',
    content: '',
    date: '',
    category: '',
    link: '',
    is_published: true
  });

  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    remote: false,
    description: '',
    requirements: '',
    benefits: '',
    salary_range: '',
    is_active: true
  });

  const [companyForm, setCompanyForm] = useState({
    section: '',
    title: '',
    content: '',
    data: {}
  });

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('brand-guidelines');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number; error?: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch press releases
      const { data: pressData, error: pressError } = await supabase
        .from('press_releases')
        .select('*')
        .order('date', { ascending: false });

      if (pressError) throw pressError;
      setPressReleases((pressData as any) || []);

      // Fetch job postings
      const { data: jobData, error: jobError } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobError) throw jobError;
      setJobPostings((jobData as any) || []);

      // Fetch company info
      const { data: companyData, error: companyError } = await supabase
        .from('company_info')
        .select('*')
        .order('section');

      if (companyError) throw companyError;
      setCompanyInfo(((companyData as any) || []).map((item: any) => ({
        ...item,
        data: typeof item.data === 'object' && item.data !== null ? item.data : {}
      })));

      // Fetch press materials from storage
      const { data: filesData, error: filesError } = await supabase.storage
        .from('press-materials')
        .list('', { limit: 100 });

      if (filesError) {
        console.log('Press materials bucket may not exist yet:', filesError);
        setPressFiles([]);
      } else {
        setPressFiles(filesData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPress) {
        const { error } = await supabase
          .from('press_releases')
          .update(pressForm as any)
          .eq('id', editingPress.id as any);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Press release updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('press_releases')
          .insert([{ ...pressForm, created_by: (await supabase.auth.getUser()).data.user?.id } as any]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Press release created successfully",
        });
      }

      setPressDialogOpen(false);
      setEditingPress(null);
      setPressForm({
        title: '',
        description: '',
        content: '',
        date: '',
        category: '',
        link: '',
        is_published: true
      });
      fetchData();
    } catch (error) {
      console.error('Error saving press release:', error);
      toast({
        title: "Error",
        description: "Failed to save press release",
        variant: "destructive",
      });
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        const { error } = await supabase
          .from('job_postings')
          .update(jobForm as any)
          .eq('id', editingJob.id as any);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Job posting updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('job_postings')
          .insert([{ ...jobForm, created_by: (await supabase.auth.getUser()).data.user?.id } as any]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Job posting created successfully",
        });
      }

      setJobDialogOpen(false);
      setEditingJob(null);
      setJobForm({
        title: '',
        department: '',
        location: '',
        type: 'Full-time',
        remote: false,
        description: '',
        requirements: '',
        benefits: '',
        salary_range: '',
        is_active: true
      });
      fetchData();
    } catch (error) {
      console.error('Error saving job posting:', error);
      toast({
        title: "Error",
        description: "Failed to save job posting",
        variant: "destructive",
      });
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        const { error } = await supabase
          .from('company_info')
          .update({
            title: companyForm.title,
            content: companyForm.content,
            data: companyForm.data,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          } as any)
          .eq('id', editingCompany.id as any);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Company information updated successfully",
        });
      }

      setCompanyDialogOpen(false);
      setEditingCompany(null);
      setCompanyForm({
        section: '',
        title: '',
        content: '',
        data: {}
      });
      fetchData();
    } catch (error) {
      console.error('Error saving company info:', error);
      toast({
        title: "Error",
        description: "Failed to save company information",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (type: 'press' | 'job', id: string) => {
    try {
      const table = type === 'press' ? 'press_releases' : 'job_postings';
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id as any);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${type === 'press' ? 'Press release' : 'Job posting'} deleted successfully`,
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const editPress = (press: PressRelease) => {
    setEditingPress(press);
    setPressForm({
      title: press.title,
      description: press.description,
      content: press.content || '',
      date: press.date,
      category: press.category,
      link: press.link || '',
      is_published: press.is_published
    });
    setPressDialogOpen(true);
  };

  const editJob = (job: JobPosting) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      remote: job.remote,
      description: job.description,
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      salary_range: job.salary_range || '',
      is_active: job.is_active
    });
    setJobDialogOpen(true);
  };

  const editCompany = (company: CompanyInfo) => {
    setEditingCompany(company);
    setCompanyForm({
      section: company.section,
      title: company.title || '',
      content: company.content || '',
      data: company.data || {}
    });
    setCompanyDialogOpen(true);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      const fileName = `${uploadCategory}/${Date.now()}-${uploadFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('press-materials')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      // Add metadata to company_info table
      const { error: dbError } = await supabase
        .from('company_info')
        .insert({
          section: 'press_materials',
          title: uploadFile.name,
          content: uploadDescription,
          data: {
            category: uploadCategory,
            file_path: fileName,
            file_size: uploadFile.size,
            file_type: uploadFile.type,
            uploaded_at: new Date().toISOString()
          },
          updated_by: (await supabase.auth.getUser()).data.user?.id
        } as any);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Press material uploaded successfully",
      });

      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadDescription('');
      setUploadCategory('brand-guidelines');
      fetchData();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload press material",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('press-materials')
        .remove([fileName]);

      if (error) throw error;

      // Remove from company_info table
      const deleteResult = await supabase
        .from('company_info')
        .delete()
        .eq('section', 'press_materials' as any)
        .eq('data->>file_path', fileName as any);

      if (deleteResult.error) throw deleteResult.error;

      toast({
        title: "Success",
        description: "Press material deleted successfully",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete press material",
        variant: "destructive",
      });
    }
  };

  const handleMediaKitUpload = async (files: File[], category: string) => {
    if (!files.length) return;

    setUploadingFiles(files.map(file => ({ name: file.name, progress: 0 })));

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${category}/${Date.now()}-${file.name}`;
        
        // Update progress
        setUploadingFiles(prev => prev.map((uploadFile, index) => 
          index === i ? { ...uploadFile, progress: 50 } : uploadFile
        ));

        const { error: uploadError } = await supabase.storage
          .from('press-materials')
          .upload(fileName, file);

        if (uploadError) {
          setUploadingFiles(prev => prev.map((uploadFile, index) => 
            index === i ? { ...uploadFile, error: uploadError.message, progress: 0 } : uploadFile
          ));
          continue;
        }

        // Add metadata to company_info table
        const { error: dbError } = await supabase
          .from('company_info')
          .insert({
            section: 'press_materials',
            title: file.name,
            content: `Media kit file for ${category.replace('-', ' ')}`,
            data: {
              category: category,
              file_path: fileName,
              file_size: file.size,
              file_type: file.type,
              uploaded_at: new Date().toISOString()
            },
            updated_by: (await supabase.auth.getUser()).data.user?.id
          } as any);

        if (dbError) {
          setUploadingFiles(prev => prev.map((uploadFile, index) => 
            index === i ? { ...uploadFile, error: dbError.message, progress: 0 } : uploadFile
          ));
          continue;
        }

        // Update progress to complete
        setUploadingFiles(prev => prev.map((uploadFile, index) => 
          index === i ? { ...uploadFile, progress: 100 } : uploadFile
        ));
      }

      toast({
        title: "Success",
        description: "Media kit files uploaded successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload media kit files",
        variant: "destructive",
      });
    } finally {
      // Clear upload progress after delay
      setTimeout(() => setUploadingFiles([]), 3000);
    }
  };

  const getFileUrl = (fileName: string) => {
    return supabase.storage
      .from('press-materials')
      .getPublicUrl(fileName).data.publicUrl;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Management</h2>
      </div>

      <Tabs defaultValue="press" className="space-y-4">
        <TabsList>
          <TabsTrigger value="press" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Press Releases
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Postings
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="press-materials" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Press Materials
          </TabsTrigger>
        </TabsList>

        {/* Press Releases Tab */}
        <TabsContent value="press" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Press Releases</h3>
            <Dialog open={pressDialogOpen} onOpenChange={setPressDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPress(null);
                  setPressForm({
                    title: '',
                    description: '',
                    content: '',
                    date: '',
                    category: '',
                    link: '',
                    is_published: true
                  });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Press Release
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPress ? 'Edit Press Release' : 'Create Press Release'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePressSubmit} className="space-y-4">
                  <Input
                    placeholder="Title"
                    value={pressForm.title}
                    onChange={(e) => setPressForm({ ...pressForm, title: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    value={pressForm.description}
                    onChange={(e) => setPressForm({ ...pressForm, description: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Content"
                    value={pressForm.content}
                    onChange={(e) => setPressForm({ ...pressForm, content: e.target.value })}
                    rows={6}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={pressForm.date}
                      onChange={(e) => setPressForm({ ...pressForm, date: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Category"
                      value={pressForm.category}
                      onChange={(e) => setPressForm({ ...pressForm, category: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    placeholder="Link (optional)"
                    value={pressForm.link}
                    onChange={(e) => setPressForm({ ...pressForm, link: e.target.value })}
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={pressForm.is_published}
                      onCheckedChange={(checked) => setPressForm({ ...pressForm, is_published: checked })}
                    />
                    <Label htmlFor="published">Published</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setPressDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPress ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pressReleases.map((press) => (
                    <TableRow key={press.id}>
                      <TableCell className="font-medium">{press.title}</TableCell>
                      <TableCell>{press.category}</TableCell>
                      <TableCell>{new Date(press.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={press.is_published ? "default" : "secondary"}>
                          {press.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editPress(press)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete('press', press.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Postings Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Job Postings</h3>
            <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingJob(null);
                  setJobForm({
                    title: '',
                    department: '',
                    location: '',
                    type: 'Full-time',
                    remote: false,
                    description: '',
                    requirements: '',
                    benefits: '',
                    salary_range: '',
                    is_active: true
                  });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Job Posting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJobSubmit} className="space-y-4">
                  <Input
                    placeholder="Job Title"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Department"
                      value={jobForm.department}
                      onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Location"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select value={jobForm.type} onValueChange={(value) => setJobForm({ ...jobForm, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Job Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Salary Range (optional)"
                      value={jobForm.salary_range}
                      onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                    />
                  </div>
                  <Textarea
                    placeholder="Job Description"
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    required
                    rows={4}
                  />
                  <Textarea
                    placeholder="Requirements (optional)"
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    rows={3}
                  />
                  <Textarea
                    placeholder="Benefits (optional)"
                    value={jobForm.benefits}
                    onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })}
                    rows={3}
                  />
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="remote"
                        checked={jobForm.remote}
                        onCheckedChange={(checked) => setJobForm({ ...jobForm, remote: checked })}
                      />
                      <Label htmlFor="remote">Remote OK</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={jobForm.is_active}
                        onCheckedChange={(checked) => setJobForm({ ...jobForm, is_active: checked })}
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setJobDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingJob ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobPostings.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>
                        {job.location}
                        {job.remote && <Badge variant="outline" className="ml-2">Remote</Badge>}
                      </TableCell>
                      <TableCell>{job.type}</TableCell>
                      <TableCell>
                        <Badge variant={job.is_active ? "default" : "secondary"}>
                          {job.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editJob(job)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete('job', job.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Info Tab */}
        <TabsContent value="company" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Company Information</h3>
          </div>

          <div className="grid gap-4">
            {companyInfo.map((info) => (
              <Card key={info.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{info.title || info.section}</CardTitle>
                      <CardDescription>Section: {info.section}</CardDescription>
                    </div>
                    <Dialog open={companyDialogOpen && editingCompany?.id === info.id} onOpenChange={setCompanyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => editCompany(info)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Company Information</DialogTitle>
                          <DialogDescription>
                            Update the content for the {info.section} section
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCompanySubmit} className="space-y-4">
                          <Input
                            placeholder="Title"
                            value={companyForm.title}
                            onChange={(e) => setCompanyForm({ ...companyForm, title: e.target.value })}
                          />
                          <Textarea
                            placeholder="Content"
                            value={companyForm.content}
                            onChange={(e) => setCompanyForm({ ...companyForm, content: e.target.value })}
                            rows={8}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setCompanyDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Update</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {info.content || 'No content available'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated: {new Date(info.updated_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Press Materials Tab */}
        <TabsContent value="press-materials" className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Media Kit Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload files for the four media kit categories displayed on the press page
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* Brand Guidelines */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Brand Guidelines</h4>
                    <Badge variant="outline">PDF</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Logo usage, colors, and brand standards</p>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center transition-colors hover:border-primary/50"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      handleMediaKitUpload(files, 'brand-guidelines');
                    }}
                  >
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        handleMediaKitUpload(files, 'brand-guidelines');
                      }}
                      className="hidden"
                      id="brand-guidelines-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('brand-guidelines-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload PDF
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">or drag and drop files here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* High-Resolution Logos */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">High-Resolution Logos</h4>
                    <Badge variant="outline">ZIP</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Vector and raster formats available</p>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center transition-colors hover:border-primary/50"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      handleMediaKitUpload(files, 'logos');
                    }}
                  >
                    <Input
                      type="file"
                      accept=".zip,.png,.jpg,.jpeg,.svg"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        handleMediaKitUpload(files, 'logos');
                      }}
                      className="hidden"
                      id="logos-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logos-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">or drag and drop files here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Screenshots */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Product Screenshots</h4>
                    <Badge variant="outline">ZIP</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">High-quality app and platform images</p>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center transition-colors hover:border-primary/50"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      handleMediaKitUpload(files, 'screenshots');
                    }}
                  >
                    <Input
                      type="file"
                      accept=".zip,.png,.jpg,.jpeg"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        handleMediaKitUpload(files, 'screenshots');
                      }}
                      className="hidden"
                      id="screenshots-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('screenshots-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">or drag and drop files here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Fact Sheet */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Company Fact Sheet</h4>
                    <Badge variant="outline">PDF</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Key statistics and company information</p>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center transition-colors hover:border-primary/50"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      handleMediaKitUpload(files, 'fact-sheet');
                    }}
                  >
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        handleMediaKitUpload(files, 'fact-sheet');
                      }}
                      className="hidden"
                      id="fact-sheet-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('fact-sheet-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload PDF
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">or drag and drop files here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <p className="text-sm font-medium">Uploading files...</p>
                    {uploadingFiles.map((file, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate">{file.name}</span>
                          <span>{file.progress}%</span>
                        </div>
                        <Progress value={file.progress} className="h-2" />
                        {file.error && (
                          <p className="text-xs text-destructive">{file.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Uploaded Files Display */}
          {companyInfo.filter(item => item.section === 'press_materials').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Media Kit Files</CardTitle>
                <CardDescription>
                  Files available for download on the press page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companyInfo
                    .filter(item => item.section === 'press_materials')
                    .map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-primary mt-1" />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.title}</h4>
                              {item.content && (
                                <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <Badge variant="outline">
                                  {item.data?.category?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </Badge>
                                <span>
                                  {item.data?.file_size ? `${Math.round(item.data.file_size / 1024)}KB` : ''}
                                </span>
                                <span>
                                  {item.data?.uploaded_at ? new Date(item.data.uploaded_at).toLocaleDateString() : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const { openUrl } = await import('@/utils/nativeBrowser');
                                await openUrl(getFileUrl(item.data?.file_path), '_blank');
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const { openUrl } = await import('@/utils/nativeBrowser');
                                await openUrl(getFileUrl(item.data?.file_path), '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFile(item.data?.file_path)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagementPanel;