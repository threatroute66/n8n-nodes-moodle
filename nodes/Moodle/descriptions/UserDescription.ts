import { INodeProperties } from 'n8n-workflow';

export const userOperations: INodeProperties[] = [
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
                action: 'Create a user',
            },
            {
                name: 'Delete',
                value: 'delete',
                description: 'Delete a user',
                action: 'Delete a user',
            },
            {
                name: 'Get',
                value: 'get',
                description: 'Get user information',
                action: 'Get a user',
            },
            {
                name: 'Get All',
                value: 'getAll',
                description: 'Get all users',
                action: 'Get all users',
            },
            {
                name: 'Update',
                value: 'update',
                description: 'Update a user',
                action: 'Update a user',
            },
        ],
        default: 'create',
    },
];

export const userFields: INodeProperties[] = [
    // Create operation fields
    {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['create'],
            },
        },
        default: '',
        description: 'The username for the new user',
    },
    {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: {
            password: true,
        },
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['create'],
            },
        },
        default: '',
        description: 'The password for the new user',
    },
    {
        displayName: 'First Name',
        name: 'firstname',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['create'],
            },
        },
        default: '',
        description: 'The first name of the user',
    },
    {
        displayName: 'Last Name',
        name: 'lastname',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['create'],
            },
        },
        default: '',
        description: 'The last name of the user',
    },
    {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['create'],
            },
        },
        default: '',
        description: 'The email address of the user',
    },
    
    // Get operation fields
    {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['user'],
                operation: ['get', 'delete', 'update'],
            },
        },
        default: '',
        description: 'The ID of the user',
    },
    
    // Additional fields for create/update
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
                displayName: 'Auth',
                name: 'auth',
                type: 'string',
                default: 'manual',
                description: 'Authentication method',
            },
            {
                displayName: 'City',
                name: 'city',
                type: 'string',
                default: '',
                description: 'User city',
            },
            {
                displayName: 'Confirmed',
                name: 'confirmed',
                type: 'boolean',
                default: true,
                description: 'Whether the user email is confirmed',
            },
            {
                displayName: 'Country',
                name: 'country',
                type: 'string',
                default: '',
                description: 'User country code (e.g., US, GB)',
            },
            {
                displayName: 'Description',
                name: 'description',
                type: 'string',
                default: '',
                description: 'User description',
            },
            {
                displayName: 'Email',
                name: 'email',
                type: 'string',
                default: '',
                description: 'User email address',
            },
            {
                displayName: 'First Name',
                name: 'firstname',
                type: 'string',
                default: '',
                description: 'User first name',
            },
            {
                displayName: 'ID Number',
                name: 'idnumber',
                type: 'string',
                default: '',
                description: 'External ID number',
            },
            {
                displayName: 'Language',
                name: 'lang',
                type: 'string',
                default: 'en',
                description: 'User language code',
            },
            {
                displayName: 'Last Name',
                name: 'lastname',
                type: 'string',
                default: '',
                description: 'User last name',
            },
            {
                displayName: 'Suspended',
                name: 'suspended',
                type: 'boolean',
                default: false,
                description: 'Whether the user account is suspended',
            },
            {
                displayName: 'Timezone',
                name: 'timezone',
                type: 'string',
                default: '99',
                description: 'User timezone',
            },
        ],
    },
];
