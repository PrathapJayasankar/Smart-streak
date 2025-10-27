import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './GroupsPage.css'; // We will create this CSS file next

const GroupsPage = ({ onSelectGroup }) => {
    const [groups, setGroups] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (err) {
            setError('Failed to fetch groups.');
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/groups', { name: groupName, description: groupDescription });
            setGroupName('');
            setGroupDescription('');
            setSuccess('Group created successfully!');
            fetchGroups(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create group.');
        }
    };

    const handleJoinGroup = async (groupId) => {
        try {
            await api.post(`/groups/${groupId}/join`);
            alert('Successfully joined group!');
            // You could also update the UI to show the user is a member
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to join group.');
        }
    };

    return (
        <div className="groups-container">
            <div className="create-group-form">
                <h2>Create a New Group</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                <form onSubmit={handleCreateGroup}>
                    <input
                        type="text"
                        placeholder="Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="Group Description"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        required
                    ></textarea>
                    <button type="submit">Create Group</button>
                </form>
            </div>

            <div className="groups-list">
                <h2>Available Groups</h2>
                {groups.length === 0 ? <p>No groups available. Create one!</p> :
                    <ul>
                        {groups.map(group => (
                            <li key={group._id} className="group-item">
                                <div className="group-info">
                                    <h3>{group.name}</h3>
                                    <p>{group.description}</p>
                                    <small>Creator: {group.creator.username}</small>
                                </div>
                                <div className="group-actions">
                                    <button onClick={() => onSelectGroup(group)}>Enter Chat</button>
                                    <button className="join-button" onClick={() => handleJoinGroup(group._id)}>Join</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                }
            </div>
        </div>
    );
};

export default GroupsPage;