import { Booking, Room, User } from "../generated/prisma-client";
import { resolveUserUsingJWT } from "../utils/resolveUser";
import { sendEmail } from "../utils/email/sendEmail";
import assert from "assert";

const createBooking = async (parent, data, ctx): Promise<Booking> => {
  const user: User | null = await resolveUserUsingJWT(ctx);
  assert.notStrictEqual(user, null, "No user login");

  const start: Date = new Date(data.start);
  const end: Date = new Date(data.end);
  const remark: string = data.remark;
  const room: Room = await ctx.prisma.room({
    number: data.room_number,
  });
  const booking: Booking = await ctx.prisma.createBooking({
    user: {
      connect: {
        username: user.username,
      },
    },
    start,
    end,
    remark,
    room: {
      connect: {
        number: room.number,
      },
    },
  });
  sendEmail({ user, booking, room });
  return booking;
};

const updateBooking = async (parent, data, ctx): Promise<Booking> => {
  const currentUser: User | null = await resolveUserUsingJWT(ctx);
  assert.notStrictEqual(currentUser, null, "No user login");
  const bookingUser: User = await ctx.prisma.booking({ id: data.id }).user();
  assert.strictEqual(currentUser.id, bookingUser.id, "User is not allowed");

  const start: Date = new Date(data.start);
  const end: Date = new Date(data.end);
  const remark: string = data.remark;
  const room: Room = await ctx.prisma.room({
    number: data.room_number,
  });
  const id = data.id;

  return ctx.prisma.updateBooking({
    data: {
      start,
      end,
      remark,
      room: {
        update: {
          number: room.number,
        },
      },
    },
    where: {
      id,
    },
  });
};

const deleteBooking = async (parent, { id }, ctx) => {
  await resolveUserUsingJWT(ctx);
  return ctx.prisma.deleteBooking({ id });
};

export { createBooking, updateBooking, deleteBooking };
