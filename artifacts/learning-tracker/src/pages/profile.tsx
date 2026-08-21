import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProfile,
  useUpdateProfile,
  useListStreaks,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useVisualEffects } from "@/components/visual-effects-provider";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Flame,
  GitBranch,
  ListTodo,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Sparkles,
  ExternalLink,
  Link2,
  Pin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";

const PINNED_LAUNCHERS_STORAGE_KEY = "open-finish:pinned-launchers";

type PinnedLauncher = {
  id: string;
  title: string;
  url: string;
};

function readPinnedLaunchers(): PinnedLauncher[] {
  try {
    const raw = window.localStorage.getItem(PINNED_LAUNCHERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (
        !item ||
        typeof item !== "object" ||
        typeof (item as PinnedLauncher).id !== "string" ||
        typeof (item as PinnedLauncher).title !== "string" ||
        typeof (item as PinnedLauncher).url !== "string"
      ) {
        return [];
      }
      return [item as PinnedLauncher];
    });
  } catch {
    return [];
  }
}

export default function Settings() {
  const profileQuery = useGetProfile();
  const {
    data: profile,
    isError: profileError,
    isFetching: profileRetrying,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = profileQuery;
  const { data: streaks = [] } = useListStreaks();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const { enabled: visualEffectsEnabled, setEnabled: setVisualEffectsEnabled } =
    useVisualEffects();
  const queryClient = useQueryClient();
  const [pinnedLaunchers, setPinnedLaunchers] =
    useState<PinnedLauncher[]>(readPinnedLaunchers);
  const [launcherFormOpen, setLauncherFormOpen] = useState(false);
  const [launcherTitle, setLauncherTitle] = useState("");
  const [launcherUrl, setLauncherUrl] = useState("");

  const persistPinnedLaunchers = (next: PinnedLauncher[]) => {
    setPinnedLaunchers(next);
    window.localStorage.setItem(
      PINNED_LAUNCHERS_STORAGE_KEY,
      JSON.stringify(next),
    );
  };

  const addPinnedLauncher = () => {
    const title = launcherTitle.trim();
    const urlInput = launcherUrl.trim();
    let url: URL;
    try {
      url = new URL(urlInput);
    } catch {
      toast({
        title: "Add a complete web address",
        description:
          "Use an http or https link, for example https://stepik.org/",
        variant: "destructive",
      });
      return;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      toast({
        title: "Only web links can be pinned",
        description: "Use an http or https address.",
        variant: "destructive",
      });
      return;
    }
    const next = [
      ...pinnedLaunchers,
      {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
        title: title || url.hostname.replace(/^www\./, ""),
        url: url.toString(),
      },
    ];
    persistPinnedLaunchers(next);
    setLauncherTitle("");
    setLauncherUrl("");
    setLauncherFormOpen(false);
    toast({ title: "Quick link pinned" });
  };

  const removePinnedLauncher = (id: string) => {
    persistPinnedLaunchers(
      pinnedLaunchers.filter((launcher) => launcher.id !== id),
    );
    toast({ title: "Quick link removed" });
  };

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const handleEdit = () => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio || "");
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (!username.trim()) {
      toast({ title: "Username is required", variant: "destructive" });
      return;
    }

    updateProfile.mutate(
      { data: { username, bio: bio || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Profile updated!" });
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          setIsEditing(false);
        },
        onError: () => {
          toast({ title: "Failed to update profile", variant: "destructive" });
        },
      },
    );
  };

  if (profileLoading) {
    return (
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        <Skeleton className="h-40 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center p-5 md:p-10">
        <section
          className="signal-surface w-full rounded-[2rem] border border-[#ff8b7c]/20 bg-[#0c1119]/92 p-8 text-center"
          role="alert"
        >
          <AlertTriangle className="mx-auto h-9 w-9 text-[#ff9a89]" />
          <h1 className="mt-5 text-2xl font-semibold text-white">
            Settings could not be opened
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/50">
            Your saved information has not changed. Check the connection and try
            again.
          </p>
          <Button
            type="button"
            onClick={() => void refetchProfile()}
            disabled={profileRetrying}
            className="mt-6 rounded-full bg-[#e95448] px-6 text-[10px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${profileRetrying ? "animate-spin" : ""}`}
            />
            Try again
          </Button>
        </section>
      </div>
    );
  }

  const longestStreak = Math.max(...streaks.map((s) => s.longestStreak), 0);
  const currentStreak = Math.max(...streaks.map((s) => s.currentStreak), 0);

  const initials = profile.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen p-8 space-y-12 animate-slide-up max-w-5xl mx-auto relative z-10 pb-20">
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">
            Settings
          </h1>
          <p className="text-red-400/80 font-bold uppercase tracking-widest text-[10px]">
            Eternal Dodjo · personal controls
          </p>
        </div>
      </div>

      <section
        aria-labelledby="visual-effects-heading"
        className="signal-surface relative overflow-hidden rounded-[2rem] border border-[#ff8b7c]/15 bg-[#0c1119]/88 p-5 shadow-[0_20px_60px_rgba(0,0,0,.18)] md:p-6"
      >
        <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-[#ff7868]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#ff8b7c]/20 bg-[#ff7868]/10 text-[#ff9a89] shadow-[0_0_26px_rgba(255,111,97,.1)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#ff9a89]">
                Dōjō atmosphere
              </p>
              <h2
                id="visual-effects-heading"
                className="mt-1 text-lg font-semibold text-white"
              >
                Visual effects
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-white/48">
                Keep the fog, leaves, gentle borders, and status-icon ambience
                moving through the workspace.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/[.07] bg-black/10 px-3 py-2">
            <span className="text-[9px] font-bold uppercase tracking-[.15em] text-white/42">
              {visualEffectsEnabled ? "On" : "Off"}
            </span>
            <Switch
              aria-label="Toggle visual effects"
              checked={visualEffectsEnabled}
              className="border-[#ff8b7c]/25 data-[state=checked]:bg-[#e95448]"
              onCheckedChange={setVisualEffectsEnabled}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="services-heading">
        <div className="mb-4 flex items-center gap-3 px-1">
          <span className="h-px w-8 bg-[#ff8b7c]/50" />
          <div>
            <h2
              id="services-heading"
              className="text-[10px] font-bold uppercase tracking-[.2em] text-white/40"
            >
              Services
            </h2>
            <p className="mt-1 text-xs text-white/34">
              Keep external tools at the edge of the practice, never in its way.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="signal-surface relative overflow-hidden rounded-[2rem] border border-[#ff8b7c]/18 bg-[linear-gradient(135deg,rgba(28,20,27,.88),rgba(12,18,27,.88))] p-5 shadow-[0_20px_60px_rgba(0,0,0,.16)] md:p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ff7868]/10 blur-3xl" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#ff8b7c]/25 bg-[#ff7868]/10 text-[#ffb1a7] shadow-[0_0_24px_rgba(255,111,97,.11)]">
                  <GitBranch className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-[#ffc268]/22 bg-[#ffc268]/[.07] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.15em] text-[#ffc268]/80">
                  Prepared
                </span>
              </div>
              <p className="mt-5 text-[9px] font-bold uppercase tracking-[.2em] text-[#ff9a89]">
                GitHub
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                Project signals
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/48">
                A quiet home for repository evidence. A commit or pull request
                will only return to a direction when you choose to keep it.
              </p>
              <div className="mt-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.15em] text-white/34">
                <ShieldCheck className="h-3.5 w-3.5 text-[#ffb1a7]/70" />
                No sync is running
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-white/[.08] bg-black/[.12] p-5 md:p-6">
            <div className="pointer-events-none absolute -bottom-12 -right-8 h-32 w-32 rounded-full bg-[#72c6b3]/[.07] blur-3xl" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#72c6b3]/20 bg-[#72c6b3]/[.07] text-[#9de1d2] shadow-[0_0_22px_rgba(114,198,179,.08)]">
                  <ListTodo className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-white/[.09] bg-white/[.035] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.15em] text-white/40">
                  Next candidate
                </span>
              </div>
              <p className="mt-5 text-[9px] font-bold uppercase tracking-[.2em] text-[#9de1d2]/76">
                Vikunja
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                Planner, when needed
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/48">
                A future place for a single next continuation — without turning
                planned tasks into finished practice.
              </p>
              <div className="mt-5 text-[9px] font-bold uppercase tracking-[.15em] text-white/30">
                Connection stays off until you invite it
              </div>
            </div>
          </article>
        </div>

        <section className="mt-5 overflow-hidden rounded-[1.65rem] border border-white/[.08] bg-black/[.12]">
          <div className="flex flex-col gap-4 border-b border-white/[.07] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#ffc268]/18 bg-[#ffc268]/[.07] text-[#ffd18a]">
                <Pin className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#ffc268]/78">
                  Pinned launchers
                </p>
                <p className="mt-1 text-sm leading-5 text-white/46">
                  Keep one useful page at hand without creating a full sync.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setLauncherFormOpen((open) => !open)}
              className="signal-button h-10 shrink-0 rounded-full bg-[#e95448] px-4 text-[9px] font-bold uppercase tracking-[.14em] text-white hover:bg-[#f26456]"
              aria-expanded={launcherFormOpen}
            >
              {launcherFormOpen ? (
                <X className="mr-2 h-3.5 w-3.5" />
              ) : (
                <Plus className="mr-2 h-3.5 w-3.5" />
              )}
              {launcherFormOpen ? "Close" : "Pin a link"}
            </Button>
          </div>

          {launcherFormOpen && (
            <form
              className="grid gap-3 border-b border-white/[.07] bg-white/[.018] p-5 md:grid-cols-[minmax(10rem,.6fr)_minmax(16rem,1.4fr)_auto] md:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                addPinnedLauncher();
              }}
            >
              <div className="space-y-2">
                <Label
                  htmlFor="pinned-launcher-title"
                  className="text-[9px] font-bold uppercase tracking-[.14em] text-white/40"
                >
                  Name{" "}
                  <span className="normal-case tracking-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="pinned-launcher-title"
                  value={launcherTitle}
                  onChange={(event) => setLauncherTitle(event.target.value)}
                  placeholder="Stepik"
                  maxLength={48}
                  className="h-11 rounded-xl border-white/10 bg-black/15 text-white placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="pinned-launcher-url"
                  className="text-[9px] font-bold uppercase tracking-[.14em] text-white/40"
                >
                  Page address
                </Label>
                <Input
                  id="pinned-launcher-url"
                  type="url"
                  value={launcherUrl}
                  onChange={(event) => setLauncherUrl(event.target.value)}
                  placeholder="https://stepik.org/lesson/..."
                  required
                  className="h-11 rounded-xl border-white/10 bg-black/15 text-white placeholder:text-white/20"
                />
              </div>
              <Button
                type="submit"
                className="signal-button h-11 rounded-xl bg-[#ffc268] px-4 text-[9px] font-bold uppercase tracking-[.14em] text-[#251510] hover:bg-[#ffd18a]"
              >
                <Pin className="mr-2 h-3.5 w-3.5" /> Save
              </Button>
            </form>
          )}

          {pinnedLaunchers.length ? (
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {pinnedLaunchers.map((launcher) => (
                <article
                  key={launcher.id}
                  className="group flex min-w-0 items-stretch overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.025] transition-colors hover:border-[#ffc268]/28 hover:bg-[#ffc268]/[.045]"
                >
                  <a
                    href={launcher.url}
                    target="_blank"
                    rel="noreferrer"
                    className="signal-button min-w-0 flex-1 px-4 py-3 text-left"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-[#ffd18a]" />
                        <span className="truncate text-sm font-semibold text-white/86">
                          {launcher.title}
                        </span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                    <span className="mt-1 block truncate text-[9px] font-medium text-white/34">
                      {launcher.url.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => removePinnedLauncher(launcher.id)}
                    className="signal-button grid w-10 shrink-0 place-items-center border-l border-white/[.07] text-white/30 hover:bg-[#ff7868]/10 hover:text-[#ff9a89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8b7c]"
                    aria-label={`Remove ${launcher.title} quick link`}
                    title="Remove quick link"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-5 text-sm text-white/38">
              <Link2 className="h-4 w-4 shrink-0 text-white/24" />
              Pin a frequently used page, such as a Stepik lesson or project
              board.
            </div>
          )}
          <p className="border-t border-white/[.06] px-5 py-3 text-[9px] font-bold uppercase tracking-[.12em] text-white/24">
            Stored in this browser · no external account connection or sync
          </p>
        </section>
      </section>

      <section aria-labelledby="personal-profile-heading">
        <div className="mb-4 flex items-center gap-3 px-1">
          <span className="h-px w-8 bg-[#ff8b7c]/50" />
          <h2
            id="personal-profile-heading"
            className="text-[10px] font-bold uppercase tracking-[.2em] text-white/40"
          >
            Personal profile
          </h2>
        </div>
        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-800" />

          <div className="flex items-start gap-10">
            <Avatar className="w-32 h-32 rounded-3xl border border-red-500/20 shadow-[0_0_30px_rgba(220,38,38,0.15)]">
              <AvatarFallback
                className="text-4xl font-bold bg-[rgba(10,10,12,0.9)] text-red-500 rounded-3xl"
                style={{ fontFamily: "serif" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pt-2">
              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="username"
                      className="text-[10px] uppercase tracking-widest font-bold text-white/40"
                    >
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your name"
                      className="rounded-2xl h-12 text-xl border-white/10 bg-white/5 mt-2 text-white backdrop-blur-xl focus-visible:ring-red-500"
                      data-testid="input-username"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="bio"
                      className="text-[10px] uppercase tracking-widest font-bold text-white/40"
                    >
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="rounded-2xl border-white/10 bg-white/5 mt-2 resize-none text-white backdrop-blur-xl focus-visible:ring-red-500"
                      data-testid="input-bio"
                    />
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    <Button
                      onClick={handleSave}
                      disabled={updateProfile.isPending}
                      className="rounded-2xl px-8 uppercase tracking-wider text-[11px] font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-lg hover:shadow-red-500/25 border-0 hover:scale-[1.02] active:scale-[0.98]"
                      data-testid="button-save"
                    >
                      {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="rounded-2xl px-8 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-xl"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-4xl font-bold mb-4 text-white tracking-wide">
                        {profile.username}
                      </h2>
                      {profile.bio ? (
                        <p className="text-lg text-white/60 border-l-2 border-red-500/50 pl-5 py-1 font-medium italic">
                          "{profile.bio}"
                        </p>
                      ) : (
                        <p className="text-sm text-white/30 border-l-2 border-white/10 pl-5 py-1 font-medium">
                          No bio yet
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleEdit}
                      className="rounded-2xl px-6 uppercase tracking-wider text-[11px] font-bold bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-xl text-white/70 hover:text-white"
                      data-testid="button-edit-profile"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/40 mt-8">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined{" "}
                      {format(new Date(profile.createdAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-500/20 rounded-3xl p-8 flex items-center gap-6 group hover:shadow-[0_10px_40px_-10px_rgba(220,38,38,0.2)] hover:-translate-y-1 transition-all backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg relative z-10">
            <Flame className="w-8 h-8" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">
              Current Streak
            </p>
            <p
              className="text-4xl font-bold text-white tracking-tight"
              data-testid="stat-current-streak"
            >
              {currentStreak}
            </p>
          </div>
        </div>

        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex items-center gap-6 hover:border-white/20 transition-all hover:-translate-y-1">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
              Longest Streak
            </p>
            <p
              className="text-4xl font-bold text-white tracking-tight"
              data-testid="stat-longest-streak"
            >
              {longestStreak}
            </p>
          </div>
        </div>

        <div className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex items-center gap-6 hover:border-white/20 transition-all hover:-translate-y-1">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
              Activities
            </p>
            <p
              className="text-4xl font-bold text-white tracking-tight"
              data-testid="stat-total-activities"
            >
              {streaks.length}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Streaks */}
      {streaks.length > 0 && (
        <div className="pt-4">
          <h2 className="text-2xl font-bold mb-8 text-white tracking-wide">
            Activity Streaks
          </h2>
          <div className="space-y-4">
            {streaks
              .sort((a, b) => b.currentStreak - a.currentStreak)
              .map((streak) => (
                <div
                  key={streak.activityId}
                  className="bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:border-white/20 flex items-center justify-between group hover:shadow-2xl"
                  data-testid={`streak-${streak.activityId}`}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1 text-white tracking-wide group-hover:text-red-400 transition-colors">
                      {streak.activityName}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Last logged:{" "}
                      {streak.lastLoggedDate
                        ? format(new Date(streak.lastLoggedDate), "MMM d, yyyy")
                        : "Never"}
                    </p>
                  </div>
                  <div className="flex items-center gap-12 border-l border-white/10 pl-8 py-2">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">
                        Current
                      </p>
                      <div className="flex items-center justify-end gap-2 text-red-400">
                        <Flame className="w-4 h-4" />
                        <span className="text-3xl font-bold tracking-tight">
                          {streak.currentStreak}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">
                        Best
                      </p>
                      <div className="flex items-center justify-end gap-2 text-white/60">
                        <Trophy className="w-4 h-4 opacity-50" />
                        <span className="text-3xl font-bold tracking-tight">
                          {streak.longestStreak}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
