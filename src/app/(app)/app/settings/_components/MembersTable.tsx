import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { settingsMessages } from "../messages";

const m = settingsMessages.members;

export type MemberRole = keyof typeof m.roles;

export interface MemberRow {
  userId: string;
  role: MemberRole;
  joinedAt: Date;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

const ROLE_VARIANT: Record<MemberRole, BadgeProps["variant"]> = {
  owner: "outline",
  admin: "neutral",
  editor: "neutral",
  viewer: "neutral",
};

function initial(member: MemberRow): string {
  return (member.fullName || member.email).charAt(0).toUpperCase();
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const TH = "px-3 py-2 text-left text-label-caps text-faint";

/** Org members with role badges; the current user is marked "Vous". */
export function MembersTable({ members, currentUserId }: { members: MemberRow[]; currentUserId: string }) {
  return (
    <div className="-mx-5 -mb-5 overflow-x-auto">
      <table className="w-full text-sm" aria-label={m.tableLabel} data-testid="members-table">
        <thead className="border-y border-border bg-surface-2/40">
          <tr>
            <th scope="col" className={cn(TH, "pl-5")}>{m.member}</th>
            <th scope="col" className={cn(TH, "pr-5 sm:pr-3")}>{m.role}</th>
            <th scope="col" className={cn(TH, "hidden pr-5 text-right sm:table-cell")}>{m.joined}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.map((member) => (
            <tr key={member.userId} className="transition-colors duration-150 hover:bg-surface-2/60">
              <td className="py-3 pl-5 pr-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-8">
                    {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
                    <AvatarFallback>{initial(member)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium text-foreground">
                      <span className="truncate">{member.fullName || member.email}</span>
                      {member.userId === currentUserId && <Badge variant="neutral">{m.you}</Badge>}
                    </p>
                    {member.fullName && <p className="truncate text-small text-muted-foreground">{member.email}</p>}
                  </div>
                </div>
              </td>
              <td className="py-3 pl-3 pr-5 sm:pr-3">
                <Badge variant={ROLE_VARIANT[member.role]}>{m.roles[member.role]}</Badge>
              </td>
              <td className="hidden py-3 pl-3 pr-5 text-right font-mono sm:table-cell text-small tabular-nums text-muted-foreground">
                {dateFormat.format(member.joinedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
