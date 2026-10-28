from .models import Connection


def find_core_paths(starting_core):
    """Return the cable route that starts at ``starting_core``.

    A route is built by following ``Connection.core_to`` links.  Both sides of
    a cable are connected to each other, so cycles have to be guarded against.
    The previous implementation assumed every route had at least two members
    and crashed with ``IndexError`` for an isolated core (for example a core of
    a newly created GPON splitter).  It also tried to pop from an empty path
    when the last core had no cable.
    """
    if starting_core is None:
        return []

    visited = set()
    stack = [(starting_core, [])]
    paths = []

    while stack:
        node, current_path = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        current_path = current_path + [node]

        neighbours = [
            conn.core_to
            for conn in Connection.objects.filter(core_from=node).select_related(
                'core_to__marker', 'core_to__cable'
            )
        ]
        unvisited = [neighbour for neighbour in neighbours if neighbour not in visited]
        if not unvisited:
            paths.append(current_path)
            continue

        for neighbour in unvisited:
            stack.append((neighbour, current_path))

    if not paths:
        return []

    # Prefer a route whose first hop crosses a cable.  This is the normal
    # client/POP/reseller route; fall back to the longest path available.
    path = next(
        (
            candidate
            for candidate in paths
            if len(candidate) >= 2
            and candidate[0].cable_id is not None
            and candidate[0].cable_id == candidate[1].cable_id
        ),
        None,
    )
    if path is None:
        path = max(paths, key=len)

    # Remove trailing splitter/output cores which do not belong to a cable.
    while len(path) > 1 and path[-1].cable_id is None:
        path.pop()

    if not path:
        return []

    # Collapse consecutive cores that sit on the same marker (the two cable
    # ends at a TJ box, for example) so the UI shows one model per column.
    result = [path[0]]
    for core in path[1:]:
        if core.marker_id == result[-1].marker_id:
            result[-1] = core
        else:
            result.append(core)
    return result
