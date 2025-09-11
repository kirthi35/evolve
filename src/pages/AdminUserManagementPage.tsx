import React, { useState, useEffect } from 'react';
import { fetchAllUsers } from '../services/airtableService';
import type { User } from '../types/airtable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'Group A' | 'Group B'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await fetchAllUsers();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.fields.Email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by group
    if (groupFilter !== 'all') {
      filtered = filtered.filter(user => user.fields.AssignedGroup === groupFilter);
    }

    // Filter by status
    if (statusFilter === 'completed') {
      filtered = filtered.filter(user => user.fields.OnboardingCompleted);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(user => !user.fields.OnboardingCompleted);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, groupFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage and monitor user participation in the study
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search by Email</Label>
              <Input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter email address..."
              />
            </div>

            {/* Group Filter */}
            <div className="space-y-2">
              <Label htmlFor="group-filter">Filter by Group</Label>
              <Select value={groupFilter} onValueChange={(value) => setGroupFilter(value as 'all' | 'Group A' | 'Group B')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="Group A">Group A</SelectItem>
                  <SelectItem value="Group B">Group B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'completed' | 'pending')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed Onboarding</SelectItem>
                  <SelectItem value="pending">Pending Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Firebase UID</TableHead>
                <TableHead>Assigned Group</TableHead>
                <TableHead>Onboarding Status</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.fields.Email}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {user.fields.UserID.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.fields.AssignedGroup === 'Group A' ? 'default' : 'secondary'}>
                      {user.fields.AssignedGroup}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.fields.OnboardingCompleted ? 'default' : 'outline'}>
                      {user.fields.OnboardingCompleted ? 'Completed' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.fields.IsAdmin ? 'destructive' : 'outline'}>
                      {user.fields.IsAdmin ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdTime ? new Date(user.createdTime).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagementPage;
