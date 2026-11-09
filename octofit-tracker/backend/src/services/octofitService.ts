import { Activity, Team, User, Workout } from '../models/index.js';
import { isValidObjectId } from 'mongoose';

type ServiceError = Error & { status: number };

function serviceError(status: number, message: string): ServiceError {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw serviceError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !isValidObjectId(userId) || typeof teamId !== 'string' || !isValidObjectId(teamId)) {
    throw serviceError(400, 'Valid user and team IDs are required');
  }
  if (typeof type !== 'string' || !type.trim() || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw serviceError(400, 'A type and positive minutes value are required');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw serviceError(400, 'Activity must reference an existing user and team');
  if (user.team?.toString() !== team._id.toString() || !team.members.some((member) => member.toString() === user._id.toString())) {
    throw serviceError(400, 'Activity user must belong to the selected team');
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw serviceError(400, 'Team details are required');
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw serviceError(400, 'A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw serviceError(400, 'A team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !isValidObjectId(member))) {
    throw serviceError(400, 'Team members must be valid user IDs');
  }
  const memberUsers = members.length > 0
    ? await User.find({ _id: { $in: members } }).select('_id team').lean()
    : [];
  if (memberUsers.length !== members.length) {
    throw serviceError(400, 'Team members must reference existing users');
  }
  if (memberUsers.some((member) => member.team) || (members.length > 0 && await Team.exists({ members: { $in: members } }))) {
    throw serviceError(400, 'Users may belong to only one team');
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members });
  if (members.length > 0) {
    try {
      const result = await User.updateMany({ _id: { $in: members }, team: null }, { $set: { team: team._id } });
      if (result.modifiedCount !== members.length) throw serviceError(409, 'A team member was assigned concurrently');
    } catch (error) {
      await Promise.all([
        Team.deleteOne({ _id: team._id }),
        User.updateMany({ _id: { $in: members }, team: team._id }, { $unset: { team: 1 } }),
      ]);
      throw error;
    }
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase().trim() }).lean();
  if (!user) throw serviceError(404, 'User not found');

  const [workouts, recentActivities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
  ]);
  const activityFocus = recentActivities[0]?.type.toLowerCase();
  const preferredFocus = user.fitnessGoal.toLowerCase() || activityFocus;
  const matchingWorkoutExists = workouts.some((workout) => workout.focus.toLowerCase() === preferredFocus);
  const focus = matchingWorkoutExists ? preferredFocus : activityFocus;

  return workouts
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === focus
        ? `Recommended for your ${user.fitnessGoal} goal and recent activity.`
        : `A ${workout.focus} option to vary your training.`,
    }))
    .sort((left, right) => Number(right.focus.toLowerCase() === focus) - Number(left.focus.toLowerCase() === focus));
}

export { User };
