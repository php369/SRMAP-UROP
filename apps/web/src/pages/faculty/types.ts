export interface Project {
    _id: string;
    projectId: string;
    title: string;
    brief: string;
    prerequisites?: string;
    department: string;
    type: 'IDP' | 'UROP' | 'CAPSTONE';
    status: 'draft' | 'published' | 'frozen' | 'assigned';
    facultyId: string;
    facultyName: string;
    facultyIdNumber: string;
    createdAt: string;
}
