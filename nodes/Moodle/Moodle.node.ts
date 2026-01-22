import {
    IExecuteFunctions,
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    ILoadOptionsFunctions,
    INodePropertyOptions,
    NodeConnectionType,
    NodeOperationError,
} from 'n8n-workflow';

import {
    moodleApiRequest,
} from './GenericFunctions';

// Import version info
import { VERSION_INFO } from './version';

// Helper function to flatten object for Moodle API
function flattenObject(obj: IDataObject, prefix: string): IDataObject {
    const flattened: IDataObject = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null && value !== '') {
            flattened[`${prefix}[${key}]`] = value;
        }
    }
    
    return flattened;
}

export class Moodle implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Moodle',
        name: 'moodle',
        icon: 'file:moodle.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: `Interact with Moodle LMS - Complete Integration (v${VERSION_INFO?.version || '0.1.0'})`,
        defaults: {
            name: 'Moodle',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'moodleApi',
                required: true,
            },
        ],
        properties: [
            // Resource Selection
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                options: [
                    {
                        name: 'User',
                        value: 'user',
                    },
                    {
                        name: 'Course',
                        value: 'course',
                    },
                    {
                        name: 'Enrollment',
                        value: 'enrollment',
                    },
                    {
                        name: 'Grade',
                        value: 'grade',
                    },
                    {
                        name: 'Message',
                        value: 'message',
                    },
                    {
                        name: 'System',
                        value: 'system',
                    },
                ],
                default: 'user',
                description: 'The resource to operate on',
            },

            // USER OPERATIONS
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['user'],
                    },
                },
                options: [
                    {
                        name: 'Create',
                        value: 'create',
                        description: 'Create a new user',
                    },
                    {
                        name: 'Get',
                        value: 'get',
                        description: 'Get a user by ID',
                    },
                    {
                        name: 'Get All',
                        value: 'getAll',
                        description: 'Get multiple users',
                    },
                    {
                        name: 'Update',
                        value: 'update',
                        description: 'Update a user',
                    },
                    {
                        name: 'Delete',
                        value: 'delete',
                        description: 'Delete a user',
                    },
                ],
                default: 'get',
                description: 'The operation to perform on users',
            },

            // COURSE OPERATIONS
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['course'],
                    },
                },
                options: [
                    {
                        name: 'Create',
                        value: 'create',
                        description: 'Create a new course',
                    },
                    {
                        name: 'Get',
                        value: 'get',
                        description: 'Get a course by ID',
                    },
                    {
                        name: 'Get All',
                        value: 'getAll',
                        description: 'Get all courses',
                    },
                    {
                        name: 'Update',
                        value: 'update',
                        description: 'Update a course',
                    },
                    {
                        name: 'Delete',
                        value: 'delete',
                        description: 'Delete a course',
                    },
                    {
                        name: 'Get Enrolled Users',
                        value: 'getEnrolledUsers',
                        description: 'Get users enrolled in course',
                    },
                    {
                        name: 'Get Categories',
                        value: 'getCategories',
                        description: 'Get course categories',
                    },
                ],
                default: 'getAll',
                description: 'The operation to perform on courses',
            },

            // ENROLLMENT OPERATIONS
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['enrollment'],
                    },
                },
                options: [
                    {
                        name: 'Enroll User',
                        value: 'enroll',
                        description: 'Enroll user in course',
                    },
                    {
                        name: 'Unenroll User',
                        value: 'unenroll',
                        description: 'Remove user from course',
                    },
                    {
                        name: 'Get User Courses',
                        value: 'getUserCourses',
                        description: 'Get courses user is enrolled in',
                    },
                    {
                        name: 'Get Course Users',
                        value: 'getCourseUsers',
                        description: 'Get users enrolled in course',
                    },
                ],
                default: 'enroll',
                description: 'The operation to perform on enrollments',
            },

            // GRADE OPERATIONS
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['grade'],
                    },
                },
                options: [
                    {
                        name: 'Get User Course Grades',
                        value: 'getUserCourseGrades',
                        description: 'Get all course grades overview for a specific user',
                    },
                    {
                        name: 'View Grade Report',
                        value: 'viewGradeReport',
                        description: 'Mark that a user viewed their grade report (logging only)',
                    },
                ],
                default: 'getUserCourseGrades',
                description: 'The operation to perform on grades',
            },

            // MESSAGE OPERATIONS
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['message'],
                    },
                },
                options: [
                    {
                        name: 'Send Message',
                        value: 'send',
                        description: 'Send message to user',
                    },
                    {
                        name: 'Get Messages',
                        value: 'getMessages',
                        description: 'Get user messages (legacy - use Get Conversations for modern Moodle)',
                    },
                    {
                        name: 'Get Conversations',
                        value: 'getConversations',
                        description: 'Get user conversations (recommended)',
                    },
                    {
                        name: 'Get Conversation Messages',
                        value: 'getConversationMessages',
                        description: 'Get messages from a specific conversation',
                    },
                ],
                default: 'send',
                description: 'The operation to perform on messages',
            },

            // SYSTEM OPERATIONS
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['system'],
                    },
                },
                options: [
                    {
                        name: 'Get Site Info',
                        value: 'getSiteInfo',
                        description: 'Get Moodle site information',
                    },
                ],
                default: 'getSiteInfo',
                description: 'The operation to perform on system',
            },

            // USER FIELDS
            {
                displayName: 'User ID',
                name: 'userId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['get', 'update', 'delete'],
                    },
                },
                default: '',
                required: true,
                description: 'The user ID',
            },
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['create'],
                    },
                },
                default: '',
                required: true,
                description: 'Username for the new user',
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['create'],
                    },
                },
                default: '',
                required: true,
                description: 'Password for the new user',
            },
            {
                displayName: 'First Name',
                name: 'firstname',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['create'],
                    },
                },
                default: '',
                required: true,
                description: 'First name of the user',
            },
            {
                displayName: 'Last Name',
                name: 'lastname',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['create'],
                    },
                },
                default: '',
                required: true,
                description: 'Last name of the user',
            },
            {
                displayName: 'Email',
                name: 'email',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['create'],
                    },
                },
                default: '',
                required: true,
                description: 'Email address of the user',
            },

            // USER GET ALL FIELDS
            {
                displayName: 'Return All',
                name: 'returnAll',
                type: 'boolean',
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['getAll'],
                    },
                },
                default: false,
                description: 'Whether to return all results or only up to a given limit',
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['getAll'],
                        returnAll: [false],
                    },
                },
                typeOptions: {
                    minValue: 1,
                    maxValue: 1000,
                },
                default: 50,
                description: 'Max number of results to return',
            },
            {
                displayName: 'Search Options',
                name: 'searchOptions',
                type: 'collection',
                placeholder: 'Add Search Option',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['getAll'],
                    },
                },
                options: [
                    {
                        displayName: 'Search By',
                        name: 'searchBy',
                        type: 'options',
                        options: [
                            {
                                name: 'All Users',
                                value: 'all',
                                description: 'Get all users without filtering',
                            },
                            {
                                name: 'Email',
                                value: 'email',
                                description: 'Search by email address',
                            },
                            {
                                name: 'First Name',
                                value: 'firstname',
                                description: 'Search by first name',
                            },
                            {
                                name: 'Last Name',
                                value: 'lastname', 
                                description: 'Search by last name',
                            },
                            {
                                name: 'Username',
                                value: 'username',
                                description: 'Search by username',
                            },
                            {
                                name: 'ID Number',
                                value: 'idnumber',
                                description: 'Search by ID number',
                            },
                        ],
                        default: 'all',
                        description: 'Field to search by',
                    },
                    {
                        displayName: 'Search Value',
                        name: 'searchValue',
                        type: 'string',
                        default: '',
                        displayOptions: {
                            hide: {
                                searchBy: ['all'],
                            },
                        },
                        description: 'Value to search for (use % as wildcard)',
                    },
                ],
            },

            // COURSE FIELDS
            {
                displayName: 'Course ID',
                name: 'courseId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['course'],
                        operation: ['get', 'update', 'delete', 'getEnrolledUsers'],
                    },
                },
                default: '',
                required: true,
                description: 'The course ID',
            },
            {
                displayName: 'Course Name',
                name: 'fullname',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['course'],
                        operation: ['create', 'update'],
                    },
                },
                default: '',
                required: true,
                description: 'Full course name',
            },
            {
                displayName: 'Short Name',
                name: 'shortname',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['course'],
                        operation: ['create', 'update'],
                    },
                },
                default: '',
                required: true,
                description: 'Course short name (unique identifier)',
            },
            {
                displayName: 'Category ID',
                name: 'categoryid',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['course'],
                        operation: ['create', 'update'],
                    },
                },
                default: 1,
                description: 'Course category ID',
            },

            // ENROLLMENT FIELDS
            {
                displayName: 'User ID',
                name: 'enrollUserId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['enrollment'],
                        operation: ['enroll', 'unenroll', 'getUserCourses'],
                    },
                },
                default: '',
                required: true,
                description: 'User ID for enrollment',
            },
            {
                displayName: 'Course ID',
                name: 'enrollCourseId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['enrollment'],
                        operation: ['enroll', 'unenroll', 'getCourseUsers'],
                    },
                },
                default: '',
                required: true,
                description: 'Course ID for enrollment',
            },
            {
                displayName: 'Role',
                name: 'roleId',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['enrollment'],
                        operation: ['enroll'],
                    },
                },
                options: [
                    {
                        name: 'Student',
                        value: 5,
                    },
                    {
                        name: 'Teacher',
                        value: 3,
                    },
                    {
                        name: 'Manager',
                        value: 1,
                    },
                    {
                        name: 'Course Creator',
                        value: 2,
                    },
                ],
                default: 5,
                description: 'Role to assign to user',
            },

            // GRADE FIELDS
            {
                displayName: 'User ID',
                name: 'gradeUserId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['grade'],
                        operation: ['getUserCourseGrades', 'viewGradeReport'],
                    },
                },
                default: '',
                required: true,
                description: 'User ID to get grades for',
            },

            // MESSAGE FIELDS
            {
                displayName: 'To User ID',
                name: 'messageToUserId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['message'],
                        operation: ['send'],
                    },
                },
                default: '',
                required: true,
                description: 'User ID to send message to',
            },
            {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                displayOptions: {
                    show: {
                        resource: ['message'],
                        operation: ['send'],
                    },
                },
                default: '',
                required: true,
                description: 'Message content',
            },
            {
                displayName: 'User ID',
                name: 'messageUserId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['message'],
                        operation: ['getMessages'],
                    },
                },
                default: '',
                required: true,
                description: 'User ID to get messages for',
            },
            {
                displayName: 'Message Filters',
                name: 'messageFilters',
                type: 'collection',
                placeholder: 'Add Filter',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['message'],
                        operation: ['getMessages'],
                    },
                },
                options: [
                    {
                        displayName: 'Message Type',
                        name: 'type',
                        type: 'options',
                        options: [
                            {
                                name: 'Both (Sent and Received)',
                                value: 'both',
                                description: 'Get both sent and received messages',
                            },
                            {
                                name: 'Received',
                                value: 'to',
                                description: 'Messages received by this user',
                            },
                            {
                                name: 'Sent',
                                value: 'from',
                                description: 'Messages sent by this user',
                            },
                        ],
                        default: 'both',
                        description: 'Type of messages to retrieve',
                    },
                    {
                        displayName: 'Read Status',
                        name: 'read',
                        type: 'options',
                        options: [
                            {
                                name: 'All',
                                value: 'all',
                                description: 'Both read and unread messages',
                            },
                            {
                                name: 'Read Only',
                                value: 1,
                                description: 'Only read messages',
                            },
                            {
                                name: 'Unread Only',
                                value: 0,
                                description: 'Only unread messages',
                            },
                        ],
                        default: 'all',
                        description: 'Filter by read status',
                    },
                    {
                        displayName: 'Limit',
                        name: 'limitnum',
                        type: 'number',
                        default: 20,
                        description: 'Maximum number of messages to retrieve',
                    },
                    {
                        displayName: 'Offset',
                        name: 'limitfrom',
                        type: 'number',
                        default: 0,
                        description: 'Number of messages to skip',
                    },
                ],
            },
            {
                displayName: 'User ID',
                name: 'conversationUserId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['message'],
                        operation: ['getConversations'],
                    },
                },
                default: '',
                required: true,
                description: 'User ID to get conversations for',
            },
            {
                displayName: 'Conversation ID',
                name: 'conversationId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['message'],
                        operation: ['getConversationMessages'],
                    },
                },
                default: '',
                required: true,
                description: 'ID of the conversation to get messages from',
            },
            {
                displayName: 'Current User ID',
                name: 'currentUserId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['message'],
                        operation: ['getConversationMessages'],
                    },
                },
                default: '',
                required: true,
                description: 'ID of the current user (required for conversation messages)',
            },

            // ADDITIONAL FIELDS - ENHANCED FOR USERS
            {
                displayName: 'Additional Fields',
                name: 'additionalFields',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['user'],
                        operation: ['create', 'update'],
                    },
                },
                options: [
                    {
                        displayName: 'Address',
                        name: 'address',
                        type: 'string',
                        default: '',
                        description: 'Postal address of the user',
                    },
                    {
                        displayName: 'City',
                        name: 'city',
                        type: 'string',
                        default: '',
                        description: 'City of the user',
                    },
                    {
                        displayName: 'Country',
                        name: 'country',
                        type: 'string',
                        default: '',
                        description: 'Country code of the user (e.g., US, GB, FR)',
                        placeholder: 'US',
                    },
                    {
                        displayName: 'Department',
                        name: 'department',
                        type: 'string',
                        default: '',
                        description: 'Department of the user',
                    },
                    {
                        displayName: 'Description',
                        name: 'description',
                        type: 'string',
                        typeOptions: {
                            rows: 4,
                        },
                        default: '',
                        description: 'User description/bio',
                    },
                    {
                        displayName: 'ID Number',
                        name: 'idnumber',
                        type: 'string',
                        default: '',
                        description: 'An arbitrary ID number for the user (e.g., student ID, employee ID)',
                    },
                    {
                        displayName: 'Institution',
                        name: 'institution',
                        type: 'string',
                        default: '',
                        description: 'Institution the user belongs to',
                    },
                    {
                        displayName: 'Mobile Phone',
                        name: 'phone2',
                        type: 'string',
                        default: '',
                        description: 'Mobile phone number of the user',
                    },
                    {
                        displayName: 'Phone',
                        name: 'phone1',
                        type: 'string',
                        default: '',
                        description: 'Primary phone number of the user',
                    },
                    {
                        displayName: 'Timezone',
                        name: 'timezone',
                        type: 'string',
                        default: '',
                        description: 'Timezone of the user (e.g., America/New_York, Europe/London, Asia/Tokyo)',
                        placeholder: 'America/New_York',
                    },
                    {
                        displayName: 'First Name',
                        name: 'firstname',
                        type: 'string',
                        default: '',
                        description: 'First name of the user',
                    },
                    {
                        displayName: 'Last Name',
                        name: 'lastname',
                        type: 'string',
                        default: '',
                        description: 'Last name of the user',
                    },
                    {
                        displayName: 'Email',
                        name: 'email',
                        type: 'string',
                        default: '',
                        description: 'Email address of the user',
                    },
                    {
                        displayName: 'Confirmed',
                        name: 'confirmed',
                        type: 'boolean',
                        default: true,
                        description: 'Whether the user account is confirmed',
                    },
                    {
                        displayName: 'Suspended',
                        name: 'suspended',
                        type: 'boolean',
                        default: false,
                        description: 'Whether the user account is suspended',
                    },
                ],
            },

            // ADDITIONAL FIELDS FOR COURSES
            {
                displayName: 'Additional Fields',
                name: 'additionalFields',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['course'],
                        operation: ['create', 'update'],
                    },
                },
                options: [
                    {
                        displayName: 'Description',
                        name: 'summary',
                        type: 'string',
                        typeOptions: {
                            rows: 4,
                        },
                        default: '',
                        description: 'Course summary/description',
                    },
                    {
                        displayName: 'ID Number',
                        name: 'idnumber',
                        type: 'string',
                        default: '',
                        description: 'Course ID number for external systems',
                    },
                    {
                        displayName: 'Format',
                        name: 'format',
                        type: 'options',
                        options: [
                            {
                                name: 'Topics',
                                value: 'topics',
                            },
                            {
                                name: 'Weekly',
                                value: 'weeks',
                            },
                            {
                                name: 'Social',
                                value: 'social',
                            },
                            {
                                name: 'Single Activity',
                                value: 'singleactivity',
                            },
                        ],
                        default: 'topics',
                        description: 'Course format',
                    },
                    {
                        displayName: 'Number of Sections',
                        name: 'numsections',
                        type: 'number',
                        default: 10,
                        description: 'Number of sections/weeks in the course',
                    },
                    {
                        displayName: 'Start Date',
                        name: 'startdate',
                        type: 'dateTime',
                        default: '',
                        description: 'Course start date',
                    },
                    {
                        displayName: 'End Date',
                        name: 'enddate',
                        type: 'dateTime',
                        default: '',
                        description: 'Course end date',
                    },
                    {
                        displayName: 'Visible',
                        name: 'visible',
                        type: 'boolean',
                        default: true,
                        description: 'Whether the course is visible to students',
                    },
                    {
                        displayName: 'Make Shortname Unique',
                        name: 'makeUnique',
                        type: 'boolean',
                        default: false,
                        description: 'Automatically append timestamp to shortname to ensure uniqueness',
                    },
                ],
            },
        ],
    };

    methods = {
        loadOptions: {
            async getCourses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                const returnData: INodePropertyOptions[] = [];
                
                try {
                    const courses = await moodleApiRequest.call(
                        this,
                        'POST',
                        {},
                        {
                            wsfunction: 'core_course_get_courses',
                        }
                    );
                    
                    for (const course of courses) {
                        returnData.push({
                            name: course.fullname,
                            value: course.id,
                        });
                    }
                } catch (error) {
                    // Return empty array if courses can't be loaded
                }
                
                return returnData;
            },
        },
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const versionString = VERSION_INFO?.version || '0.1.0';
        const buildDate = VERSION_INFO?.buildDate || 'unknown';
        console.log(`🚀 MOODLE NODE EXECUTING - Version ${versionString} - Built on ${buildDate}`);
        
        const items = this.getInputData();
        console.log(`Processing ${items.length} items`);
        
        const returnData: INodeExecutionData[] = [];
        
        const resource = this.getNodeParameter('resource', 0) as string;
        const operation = this.getNodeParameter('operation', 0) as string;
        
        console.log(`Resource: ${resource}, Operation: ${operation}`);
        
        for (let i = 0; i < items.length; i++) {
            console.log(`\n--- Processing item ${i + 1} of ${items.length} ---`);
            try {
                let responseData;
                
                // USER OPERATIONS
                if (resource === 'user') {
                    if (operation === 'create') {
                        const username = this.getNodeParameter('username', i) as string;
                        const password = this.getNodeParameter('password', i) as string;
                        const firstname = this.getNodeParameter('firstname', i) as string;
                        const lastname = this.getNodeParameter('lastname', i) as string;
                        const email = this.getNodeParameter('email', i) as string;
                        const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
                        
                        const userParams = {
                            wsfunction: 'core_user_create_users',
                            'users[0][username]': username,
                            'users[0][password]': password,
                            'users[0][firstname]': firstname,
                            'users[0][lastname]': lastname,
                            'users[0][email]': email,
                        };

                        if (Object.keys(additionalFields).length > 0) {
                            // Convert booleans to 1/0 for Moodle
                            if (additionalFields.confirmed !== undefined) {
                                additionalFields.confirmed = additionalFields.confirmed ? 1 : 0;
                            }
                            if (additionalFields.suspended !== undefined) {
                                additionalFields.suspended = additionalFields.suspended ? 1 : 0;
                            }
                            
                            const flattenedFields = flattenObject(additionalFields, 'users[0]');
                            Object.assign(userParams, flattenedFields);
                        }

                        responseData = await moodleApiRequest.call(this, 'POST', {}, userParams);
                        
                        // Handle the response - Moodle returns an array of created users
                        if (Array.isArray(responseData) && responseData.length > 0) {
                            // Extract the first user and mark it as a single item
                            responseData = {
                                ...responseData[0],
                                _created: true,
                                _username: username
                            };
                            console.log('Extracted single user from array:', responseData);
                        }
                    }
                    
                    if (operation === 'get') {
                        const userId = this.getNodeParameter('userId', i) as string;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_user_get_users_by_field',
                                field: 'id',
                                'values[0]': userId,
                            }
                        );
                        
                        responseData = responseData[0];
                    }
                    
                    if (operation === 'getAll') {
                        const returnAll = this.getNodeParameter('returnAll', i) as boolean;
                        const limit = this.getNodeParameter('limit', i, 50) as number;
                        const searchOptions = this.getNodeParameter('searchOptions', i) as IDataObject;
                        
                        const params: IDataObject = {
                            wsfunction: 'core_user_get_users',
                        };
                        
                        // Build search criteria based on options
                        const searchBy = searchOptions.searchBy || 'all';
                        const searchValue = searchOptions.searchValue as string || '';
                        
                        if (searchBy === 'all') {
                            // Get all users by using email with wildcard
                            params['criteria[0][key]'] = 'email';
                            params['criteria[0][value]'] = '%';
                        } else {
                            // Search by specific field
                            params['criteria[0][key]'] = searchBy;
                            params['criteria[0][value]'] = searchValue || '%';
                        }
                        
                        console.log(`Searching users by ${searchBy} with value: ${params['criteria[0][value]']}`);
                        
                        try {
                            responseData = await moodleApiRequest.call(this, 'POST', {}, params);
                        } catch (error) {
                            // If search by email fails, try alternative method
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            if (searchBy === 'all' && errorMessage.includes('invalidparameter')) {
                                console.log('Email wildcard search failed, trying alternative method...');
                                
                                // Alternative: Get users by searching for common domain
                                params['criteria[0][key]'] = 'email';
                                params['criteria[0][value]'] = '@';
                                
                                try {
                                    responseData = await moodleApiRequest.call(this, 'POST', {}, params);
                                } catch (secondError) {
                                    // If that also fails, try getting specific user IDs
                                    console.log('Alternative search failed, falling back to empty criteria');
                                    delete params['criteria[0][key]'];
                                    delete params['criteria[0][value]'];
                                    params['criteria'] = [];
                                    
                                    responseData = await moodleApiRequest.call(this, 'POST', {}, params);
                                }
                            } else {
                                throw error;
                            }
                        }
                        
                        // Extract users array from response
                        if (responseData && responseData.users) {
                            responseData = responseData.users;
                            console.log(`Found ${responseData.length} users`);
                            
                            // Apply limit if not returning all
                            if (!returnAll && responseData.length > limit) {
                                responseData = responseData.slice(0, limit);
                                console.log(`Limited to ${limit} users`);
                            }
                        } else if (responseData && !responseData.warnings) {
                            // If no users array but also no warnings, might be a different response format
                            console.log('Unexpected response format:', responseData);
                            responseData = [];
                        } else {
                            responseData = [];
                        }
                        
                        // Add warning if no users found
                        if (responseData.length === 0) {
                            console.warn('No users found. This might be due to permissions or search criteria.');
                        }
                    }
                    
                    if (operation === 'update') {
                        const userId = this.getNodeParameter('userId', i) as string;
                        const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
                        
                        const updateParams = {
                            wsfunction: 'core_user_update_users',
                            'users[0][id]': userId,
                        };

                        if (Object.keys(additionalFields).length > 0) {
                            // Convert booleans to 1/0 for Moodle
                            if (additionalFields.confirmed !== undefined) {
                                additionalFields.confirmed = additionalFields.confirmed ? 1 : 0;
                            }
                            if (additionalFields.suspended !== undefined) {
                                additionalFields.suspended = additionalFields.suspended ? 1 : 0;
                            }
                            
                            const flattenedFields = flattenObject(additionalFields, 'users[0]');
                            Object.assign(updateParams, flattenedFields);
                        }

                        responseData = await moodleApiRequest.call(this, 'POST', {}, updateParams);
                    }
                    
                    if (operation === 'delete') {
                        const userId = this.getNodeParameter('userId', i) as string;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_user_delete_users',
                                'userids[0]': userId,
                            }
                        );
                        
                        // Handle null response for successful deletion
                        if (responseData === null || responseData === undefined) {
                            responseData = { success: true, message: `User ${userId} deleted successfully` };
                        }
                    }
                }

                // COURSE OPERATIONS
                if (resource === 'course') {
                    if (operation === 'create') {
                        const fullname = this.getNodeParameter('fullname', i) as string;
                        let shortname = this.getNodeParameter('shortname', i) as string;
                        const categoryid = this.getNodeParameter('categoryid', i) as number;
                        const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
                        
                        // Check if we should make shortname unique
                        if (additionalFields.makeUnique) {
                            const timestamp = Date.now();
                            shortname = `${shortname}_${timestamp}`;
                            console.log(`Making shortname unique: ${shortname}`);
                            // Remove makeUnique from additionalFields so it's not sent to Moodle
                            delete additionalFields.makeUnique;
                        }
                        
                        const courseParams = {
                            wsfunction: 'core_course_create_courses',
                            'courses[0][fullname]': fullname,
                            'courses[0][shortname]': shortname,
                            'courses[0][categoryid]': categoryid,
                        };

                        if (Object.keys(additionalFields).length > 0) {
                            // Convert dates to Unix timestamps if present
                            if (additionalFields.startdate) {
                                additionalFields.startdate = Math.floor(new Date(additionalFields.startdate as string).getTime() / 1000);
                            }
                            if (additionalFields.enddate) {
                                additionalFields.enddate = Math.floor(new Date(additionalFields.enddate as string).getTime() / 1000);
                            }
                            // Convert boolean to 1/0 for Moodle
                            if (additionalFields.visible !== undefined) {
                                additionalFields.visible = additionalFields.visible ? 1 : 0;
                            }
                            
                            const flattenedFields = flattenObject(additionalFields, 'courses[0]');
                            Object.assign(courseParams, flattenedFields);
                        }

                        console.log(`Creating course with shortname: ${shortname}`);
                        responseData = await moodleApiRequest.call(this, 'POST', {}, courseParams);
                        
                        // Log the raw response for debugging
                        console.log('Course creation response:', JSON.stringify(responseData, null, 2));
                        
                        // Handle the response - Moodle returns an array of created courses
                        if (Array.isArray(responseData) && responseData.length > 0) {
                            // Extract the first course and mark it as a single item
                            responseData = {
                                ...responseData[0],
                                _created: true,
                                _shortname: shortname
                            };
                            console.log('Extracted single course from array:', responseData);
                        }
                    }
                    
                    if (operation === 'get') {
                        const courseId = this.getNodeParameter('courseId', i) as string;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_course_get_courses_by_field',
                                field: 'id',
                                value: courseId,
                            }
                        );
                        
                        responseData = responseData.courses[0];
                    }
                    
                    if (operation === 'getAll') {
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_course_get_courses',
                            }
                        );
                    }
                    
                    if (operation === 'update') {
                        const courseId = this.getNodeParameter('courseId', i) as string;
                        const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
                        
                        const updateParams = {
                            wsfunction: 'core_course_update_courses',
                            'courses[0][id]': courseId,
                        };

                        if (Object.keys(additionalFields).length > 0) {
                            const flattenedFields = flattenObject(additionalFields, 'courses[0]');
                            Object.assign(updateParams, flattenedFields);
                        }

                        responseData = await moodleApiRequest.call(this, 'POST', {}, updateParams);
                    }
                    
                    if (operation === 'delete') {
                        const courseId = this.getNodeParameter('courseId', i) as string;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_course_delete_courses',
                                'courseids[0]': courseId,
                            }
                        );
                        
                        // Handle null response for successful deletion
                        if (responseData === null || responseData === undefined) {
                            responseData = { success: true, message: `Course ${courseId} deleted successfully` };
                        }
                    }
                    
                    if (operation === 'getEnrolledUsers') {
                        const courseId = this.getNodeParameter('courseId', i) as string;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_enrol_get_enrolled_users',
                                courseid: courseId,
                            }
                        );
                    }
                    
                    if (operation === 'getCategories') {
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_course_get_categories',
                            }
                        );
                    }
                }

                // ENROLLMENT OPERATIONS
                if (resource === 'enrollment') {
                    if (operation === 'enroll') {
                        const userId = this.getNodeParameter('enrollUserId', i) as string;
                        const courseId = this.getNodeParameter('enrollCourseId', i) as string;
                        const roleId = this.getNodeParameter('roleId', i) as number;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'enrol_manual_enrol_users',
                                'enrolments[0][userid]': userId,
                                'enrolments[0][courseid]': courseId,
                                'enrolments[0][roleid]': roleId,
                            }
                        );
                    }
                    
                    if (operation === 'unenroll') {
                        const userId = this.getNodeParameter('enrollUserId', i) as string;
                        const courseId = this.getNodeParameter('enrollCourseId', i) as string;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'enrol_manual_unenrol_users',
                                'enrolments[0][userid]': userId,
                                'enrolments[0][courseid]': courseId,
                            }
                        );
                    }
                    
                    if (operation === 'getUserCourses') {
                        const userId = this.getNodeParameter('enrollUserId', i) as string;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_enrol_get_users_courses',
                                userid: userId,
                            }
                        );
                    }
                    
                    if (operation === 'getCourseUsers') {
                        const courseId = this.getNodeParameter('enrollCourseId', i) as string;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_enrol_get_enrolled_users',
                                courseid: courseId,
                            }
                        );
                    }
                }

                // GRADE OPERATIONS
                if (resource === 'grade') {
                    if (operation === 'getUserCourseGrades') {
                        const userId = this.getNodeParameter('gradeUserId', i) as string;
                        
                        console.log(`Getting all course grades for user ${userId}...`);
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'gradereport_overview_get_course_grades',
                                userid: userId,
                            }
                        );
                        
                        // Extract grades array if present
                        if (responseData && responseData.grades) {
                            console.log(`Found grades for ${responseData.grades.length} courses`);
                            
                            // Add helpful information if no grades found
                            if (responseData.grades.length === 0) {
                                responseData = {
                                    userid: userId,
                                    grades: [],
                                    message: 'No course grades found. Make sure: 1) User is enrolled in courses, 2) Grades have been entered, 3) Grades are visible to students',
                                };
                            } else {
                                responseData = responseData.grades;
                            }
                        } else {
                            console.log('No course grades found for this user');
                            responseData = {
                                userid: userId,
                                grades: [],
                                message: 'No course grades found. This could mean: 1) User has no grades yet, 2) Grades are hidden, or 3) Permission issues',
                            };
                        }
                    }
                    
                    if (operation === 'viewGradeReport') {
                        const userId = this.getNodeParameter('gradeUserId', i) as string;
                        
                        console.log(`Viewing grade report for user ${userId}...`);
                        
                        try {
                            responseData = await moodleApiRequest.call(
                                this,
                                'POST',
                                {},
                                {
                                    wsfunction: 'gradereport_overview_view_grade_report',
                                    userid: userId,
                                }
                            );
                            
                            // This function typically returns a status rather than actual grades
                            console.log('Grade report view response:', JSON.stringify(responseData, null, 2));
                            
                            if (responseData && responseData.status !== false) {
                                responseData = {
                                    success: true,
                                    userid: userId,
                                    message: 'Grade report viewed successfully. Note: This function logs the view but does not return actual grades.',
                                    warnings: responseData.warnings || [],
                                };
                            }
                        } catch (error) {
                            console.error('Error viewing grade report:', error);
                            throw error;
                        }
                    }
                }

                // MESSAGE OPERATIONS
                if (resource === 'message') {
                    if (operation === 'send') {
                        const toUserId = this.getNodeParameter('messageToUserId', i) as string;
                        const messageText = this.getNodeParameter('messageText', i) as string;
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_message_send_instant_messages',
                                'messages[0][touserid]': toUserId,
                                'messages[0][text]': messageText,
                            }
                        );
                        
                        // Extract the first message and add helpful info
                        if (Array.isArray(responseData) && responseData.length > 0) {
                            const sentMessage = responseData[0];
                            responseData = {
                                ...sentMessage,
                                _sent: true,
                                _toUserId: toUserId,
                                _note: `Message sent successfully. To retrieve this message:
1. Use "Get Conversations" with User ID ${sentMessage.useridfrom} to find conversation ID ${sentMessage.conversationid}
2. Use "Get Conversation Messages" with Conversation ID ${sentMessage.conversationid}
3. Or try "Get Messages" with User ID ${sentMessage.useridfrom} and Message Type "Sent"`
                            };
                        }
                    }
                    
                    if (operation === 'getMessages') {
                        const userId = this.getNodeParameter('messageUserId', i) as string;
                        const messageFilters = this.getNodeParameter('messageFilters', i) as IDataObject;
                        
                        const type = messageFilters.type || 'both';
                        const read = messageFilters.read;
                        const limitnum = (messageFilters.limitnum as number) || 20;
                        const limitfrom = (messageFilters.limitfrom as number) || 0;
                        
                        let allMessages: any[] = [];
                        
                        // Get received messages if type is 'to' or 'both'
                        if (type === 'to' || type === 'both') {
                            const receivedParams: IDataObject = {
                                wsfunction: 'core_message_get_messages',
                                useridto: userId,
                                useridfrom: 0, // 0 means any user
                                limitfrom: limitfrom,
                                limitnum: limitnum,
                            };
                            
                            if (read !== 'all' && read !== undefined) {
                                receivedParams.read = read;
                            }
                            
                            console.log('Getting received messages...');
                            const receivedResponse = await moodleApiRequest.call(this, 'POST', {}, receivedParams);
                            
                            if (receivedResponse && receivedResponse.messages && Array.isArray(receivedResponse.messages)) {
                                console.log(`Found ${receivedResponse.messages.length} received messages`);
                                allMessages.push(...receivedResponse.messages.map((msg: any) => ({
                                    ...msg,
                                    _messageDirection: 'received'
                                })));
                            } else if (receivedResponse && !receivedResponse.messages) {
                                console.log('Received messages response format:', JSON.stringify(receivedResponse, null, 2));
                            }
                        }
                        
                        // Get sent messages if type is 'from' or 'both'
                        if (type === 'from' || type === 'both') {
                            const sentParams: IDataObject = {
                                wsfunction: 'core_message_get_messages',
                                useridfrom: userId,
                                useridto: 0, // Required parameter - 0 means any user
                                limitfrom: limitfrom,
                                limitnum: limitnum,
                            };
                            
                            if (read !== 'all' && read !== undefined) {
                                sentParams.read = read;
                            }
                            
                            console.log('Getting sent messages...');
                            const sentResponse = await moodleApiRequest.call(this, 'POST', {}, sentParams);
                            
                            if (sentResponse && sentResponse.messages && Array.isArray(sentResponse.messages)) {
                                console.log(`Found ${sentResponse.messages.length} sent messages`);
                                allMessages.push(...sentResponse.messages.map((msg: any) => ({
                                    ...msg,
                                    _messageDirection: 'sent'
                                })));
                            } else if (sentResponse && !sentResponse.messages) {
                                console.log('Sent messages response format:', JSON.stringify(sentResponse, null, 2));
                            }
                        }
                        
                        // Sort messages by time (newest first)
                        allMessages.sort((a, b) => b.timecreated - a.timecreated);
                        
                        // Limit to requested number if getting both types
                        if (type === 'both' && allMessages.length > limitnum) {
                            allMessages = allMessages.slice(0, limitnum);
                        }
                        
                        console.log(`Total messages found: ${allMessages.length}`);
                        
                        if (allMessages.length === 0) {
                            console.log('\n⚠️  No messages found. Common reasons:');
                            console.log('1. Messages might be in conversations - try "Get Conversations" instead');
                            console.log('2. The user might not have any messages in the selected direction');
                            console.log('3. Messages might be marked as read/unread differently than expected');
                            console.log('4. For messages you just sent, try searching with type "Sent" and the sender\'s user ID');
                            console.log('5. Modern Moodle uses conversations - legacy message API might not show recent messages');
                            console.log('\n💡 TIP: Use "Get Conversations" followed by "Get Conversation Messages" for best results');
                        }
                        
                        responseData = allMessages;
                    }
                    
                    if (operation === 'getConversations') {
                        const userId = this.getNodeParameter('conversationUserId', i) as string;
                        
                        console.log(`Getting conversations for user ${userId}...`);
                        
                        try {
                            responseData = await moodleApiRequest.call(
                                this,
                                'POST',
                                {},
                                {
                                    wsfunction: 'core_message_get_conversations',
                                    userid: userId,
                                    limitfrom: 0,
                                    limitnum: 50,
                                    // Removed includecontactrequests and includeprivacyinfo as they're not supported
                                }
                            );
                            
                            // Handle the response - extract conversations array if present
                            if (responseData && responseData.conversations) {
                                console.log(`Found ${responseData.conversations.length} conversations`);
                                responseData = responseData.conversations;
                            } else if (Array.isArray(responseData)) {
                                console.log(`Found ${responseData.length} conversations (direct array format)`);
                            } else {
                                console.log('Unexpected conversations format:', JSON.stringify(responseData, null, 2));
                                // If empty response, return empty array
                                if (!responseData) {
                                    responseData = [];
                                }
                            }
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            if (errorMessage.includes('Invalid web service function')) {
                                console.error('Conversations API not available - this Moodle version might not support it');
                                throw new NodeOperationError(
                                    this.getNode(),
                                    'Conversations API not available. This feature requires Moodle 3.6 or higher. Try using "Get Messages" instead.',
                                    { itemIndex: i }
                                );
                            }
                            throw error;
                        }
                    }
                    
                    if (operation === 'getConversationMessages') {
                        const conversationId = this.getNodeParameter('conversationId', i) as string;
                        const currentUserId = this.getNodeParameter('currentUserId', i) as string;
                        
                        console.log(`Getting messages for conversation ${conversationId}...`);
                        
                        try {
                            responseData = await moodleApiRequest.call(
                                this,
                                'POST',
                                {},
                                {
                                    wsfunction: 'core_message_get_conversation_messages',
                                    currentuserid: currentUserId,
                                    convid: conversationId,
                                    limitfrom: 0,
                                    limitnum: 100,
                                    // Removed 'newest' parameter - it might not be supported in all versions
                                }
                            );
                            
                            // Handle the response - extract messages array if present
                            if (responseData && responseData.messages) {
                                console.log(`Found ${responseData.messages.length} messages in conversation`);
                                responseData = responseData.messages;
                            } else if (Array.isArray(responseData)) {
                                console.log(`Found ${responseData.length} messages (direct array format)`);
                            } else {
                                console.log('Unexpected conversation messages format:', JSON.stringify(responseData, null, 2));
                                // If empty response, return empty array
                                if (!responseData) {
                                    responseData = [];
                                }
                            }
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            if (errorMessage.includes('Invalid web service function')) {
                                console.error('Conversation messages API not available - this Moodle version might not support it');
                                throw new NodeOperationError(
                                    this.getNode(),
                                    'Conversation messages API not available. This feature requires Moodle 3.6 or higher.',
                                    { itemIndex: i }
                                );
                            }
                            throw error;
                        }
                    }
                }
                
                // SYSTEM OPERATIONS
                if (resource === 'system') {
                    if (operation === 'getSiteInfo') {
                        console.log('Getting Moodle site information...');
                        
                        responseData = await moodleApiRequest.call(
                            this,
                            'POST',
                            {},
                            {
                                wsfunction: 'core_webservice_get_site_info',
                            }
                        );
                        
                        // Add helpful information about available functions
                        if (responseData) {
                            console.log('Site info retrieved successfully');
                            responseData = {
                                ...responseData,
                                _note: 'To see available functions, check your Moodle web service configuration',
                                _tip: 'Site administration → Server → Web services → External services',
                            };
                        }
                    }
                }
                
                // Handle response data
                if (Array.isArray(responseData)) {
                    returnData.push(...responseData.map(item => ({ json: item })));
                } else if (responseData) {
                    returnData.push({ json: responseData });
                } else {
                    // Handle null/undefined responses
                    returnData.push({ json: { success: true } });
                }
                
            } catch (error) {
                console.error(`Error processing item ${i + 1}:`, error);
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: (error as Error).message } });
                    continue;
                }
                throw error;
            }
        }
        
        console.log(`\nTotal items processed: ${items.length}`);
        console.log(`Total items returned: ${returnData.length}`);
        
        return [returnData];
    }
}